using System.Diagnostics;
using DetectiveCTF.Core.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DetectiveCTF.Infrastructure.Services;

public class DockerService
{
    private readonly ILogger<DockerService> _logger;
    private readonly string _ctfNetwork;
    private readonly string _hostIp;
    private readonly string _networkSubnet;
    private readonly string _kaliImage;

    public DockerService(ILogger<DockerService> logger, IConfiguration configuration)
    {
        _logger        = logger;
        _ctfNetwork    = configuration["Docker:Network"]       ?? "ctf-network";
        _hostIp        = configuration["Docker:HostIp"]        ?? "127.0.0.1";
        _networkSubnet = configuration["Docker:NetworkSubnet"] ?? "172.30.0.0/16";
        _kaliImage     = configuration["Docker:KaliImage"]     ?? "barslab/desktop:latest";
        // Uygulama başlarken network'ü oluştur
        _ = EnsureNetworkExists();
    }

    /* ── Docker network oluştur (yoksa) ── */
    private async Task EnsureNetworkExists()
    {
        try
        {
            var existing = await RunDockerCommand($"network ls --filter name={_ctfNetwork} --format {{{{.Name}}}}");
            if (!existing.Contains(_ctfNetwork))
            {
                await RunDockerCommand($"network create --driver bridge --subnet {_networkSubnet} {_ctfNetwork}");
                _logger.LogInformation("CTF network oluşturuldu: {Network}", _ctfNetwork);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Network oluşturma hatası");
        }
    }

    private async Task<string> RunDockerCommand(string arguments)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "docker",
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi);
        if (process == null) return string.Empty;

        await process.WaitForExitAsync();
        var output = await process.StandardOutput.ReadToEndAsync();
        var error = await process.StandardError.ReadToEndAsync();

        if (!string.IsNullOrWhiteSpace(error))
            _logger.LogWarning("Docker stderr: {Error}", error);

        return output.Trim();
    }

    /* ── Container'ın ctf-network üzerindeki IP'sini al ── */
    private async Task<string?> GetContainerNetworkIP(string containerId)
    {
        try
        {
            // Go template syntax: {{ }} — C# string'de escape gerekiyor
            var ip = await RunDockerCommand(
                "inspect -f \"{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}\" " + containerId);
            var ips = ip.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            foreach (var i in ips)
            {
                var trimmed = i.Trim();
                if (!string.IsNullOrWhiteSpace(trimmed))
                    return trimmed;
            }
            return null;
        }
        catch { return null; }
    }

    /* ══════════════════════════════════════════
       Senaryo bazlı VM — tek container, tüm sorular bu makineden
       HackViser tarzı: internal IP, port mapping yok
    ══════════════════════════════════════════ */
    public async Task<VMInstance?> StartVMForCase(int caseId, string dockerImage, int? userId, int? teamId)
    {
        try
        {
            await EnsureNetworkExists();

            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_case_{caseId}_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            // Image yoksa pull et
            var imageCheck = await RunDockerCommand($"images -q {dockerImage}");
            if (string.IsNullOrWhiteSpace(imageCheck))
            {
                _logger.LogInformation("Image çekiliyor: {Image}", dockerImage);
                await RunDockerCommand($"pull {dockerImage}");
            }

            // Container başlat — PORT MAPPING YOK, sadece ctf-network'e bağla
            // HackViser gibi: container kendi IP'sini alır, dışarıya port açılmaz
            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} " +
                $"--network {_ctfNetwork} " +
                $"--memory=512m --cpus=1.0 " +
                $"--cap-add=NET_ADMIN " +
                $"{dockerImage}");

            if (string.IsNullOrWhiteSpace(containerId) || containerId.Length < 12)
                return null;

            // Container'ın başlaması için bekle
            await Task.Delay(3000);

            // Container'ın ctf-network üzerindeki IP'sini al
            var containerIp = await GetContainerNetworkIP(containerId);
            if (string.IsNullOrWhiteSpace(containerIp))
            {
                _logger.LogError("Container IP alınamadı: {Name}", containerName);
                await RunDockerCommand($"rm -f {containerId}");
                return null;
            }

            _logger.LogInformation("CTF VM başlatıldı: {Name} → {IP}", containerName, containerIp);

            return new VMInstance
            {
                ChallengeId = null,
                UserId = userId,
                TeamId = teamId,
                ContainerId = containerId,
                ContainerName = containerName,
                IPAddress = containerIp,   // 172.30.x.x — internal IP
                Port = 0,                  // Port mapping yok, tüm portlar açık
                Status = "running",
                ExpiresAt = DateTime.UtcNow.AddHours(4)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Senaryo VM başlatma hatası");
            return null;
        }
    }

    /* ── Senaryo VM'inin açık portlarını döndür (internal) ── */
    public async Task<Dictionary<string, int>> GetCaseVMPorts(string containerId)
    {
        // Internal network'te port mapping yok — container'ın expose ettiği portları döndür
        var ports = new Dictionary<string, int>();
        try
        {
            // Container'ın expose ettiği portları inspect ile al
            var exposed = await RunDockerCommand(
                $"inspect -f {{{{json .Config.ExposedPorts}}}} {containerId}");

            // Yaygın portları kontrol et
            if (exposed.Contains("\"22/tcp\""))  ports["22"]   = 22;
            if (exposed.Contains("\"80/tcp\""))  ports["80"]   = 80;
            if (exposed.Contains("\"8080/tcp\""))ports["8080"] = 8080;
            if (exposed.Contains("\"443/tcp\"")) ports["443"]  = 443;
            if (exposed.Contains("\"3306/tcp\""))ports["3306"] = 3306;
            if (exposed.Contains("\"5432/tcp\""))ports["5432"] = 5432;
            if (exposed.Contains("\"6379/tcp\""))ports["6379"] = 6379;
        }
        catch { }
        return ports;
    }

    /* ══════════════════════════════════════════
       Kali Desktop — ctf-network'e bağlı
       Böylece Kali, CTF makinelerine direkt erişebilir
    ══════════════════════════════════════════ */
    public async Task<VMInstance?> StartKaliDesktop(int? userId, int? teamId, string targetIp)
    {
        try
        {
            await EnsureNetworkExists();

            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_kali_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            // Kali'yi hem ctf-network'e hem de host port mapping ile başlat
            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} " +
                $"--network {_ctfNetwork} " +
                $"-P " +
                $"--memory=2g --cpus=1.5 --shm-size=512m " +
                $"{_kaliImage}");

            if (string.IsNullOrWhiteSpace(containerId) || containerId.Length < 12)
                return null;

            await Task.Delay(15000);

            var portOutput = await RunDockerCommand($"port {containerId}");

            int hostPort = 0;
            foreach (var line in portOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
            {
                if (line.StartsWith("6080/") && line.Contains("->"))
                {
                    var p = line.Split("->").Last().Trim().Split(':').Last().Trim();
                    if (int.TryParse(p, out var hp)) { hostPort = hp; break; }
                }
            }
            if (hostPort == 0) hostPort = ParseHostPort(portOutput, 6080);

            if (hostPort == 0)
            {
                await RunDockerCommand($"rm -f {containerId}");
                return null;
            }

            _logger.LogInformation("Kali başlatıldı: {Name} → port {Port}", containerName, hostPort);

            return new VMInstance
            {
                ChallengeId = null,
                UserId = userId,
                TeamId = teamId,
                ContainerId = containerId,
                ContainerName = containerName,
                IPAddress = _hostIp,
                Port = hostPort,
                Status = "running",
                ExpiresAt = DateTime.UtcNow.AddHours(4)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kali başlatma hatası");
            return null;
        }
    }

    /* ── Eski soru bazlı VM (artık kullanılmıyor ama geriye dönük uyumluluk için) ── */
    public async Task<VMInstance?> StartVMForChallenge(Challenge challenge, int? userId, int? teamId)
    {
        _logger.LogWarning("StartVMForChallenge çağrıldı ama artık kullanılmıyor. Senaryo bazlı VM kullanın.");
        return null;
    }

    public async Task<bool> StopVM(VMInstance vm)
    {
        try
        {
            await RunDockerCommand($"stop {vm.ContainerId}");
            await RunDockerCommand($"rm -f {vm.ContainerId}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VM durdurma hatası");
            return false;
        }
    }

    public async Task<string> GetVMStatus(string containerId)
    {
        try
        {
            var status = await RunDockerCommand($"inspect -f {{{{.State.Status}}}} {containerId}");
            return status.Trim('\'', '"', '\n');
        }
        catch { return "error"; }
    }

    private int ParseHostPort(string portOutput, int containerPort = 22)
    {
        if (string.IsNullOrWhiteSpace(portOutput)) return 0;
        foreach (var line in portOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            if (line.Contains("->"))
            {
                var parts = line.Split("->");
                if (parts.Length == 2)
                {
                    var hostPart = parts[1].Trim();
                    var colonIdx = hostPart.LastIndexOf(':');
                    if (colonIdx >= 0 && int.TryParse(hostPart[(colonIdx + 1)..], out var port))
                        return port;
                }
            }
        }
        return 0;
    }

    /* ── Web Terminal — geriye dönük uyumluluk ── */
    public async Task<VMInstance?> StartWebTerminal(int? userId, int? teamId, string targetIp, int targetPort)
    {
        try
        {
            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_terminal_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} -P " +
                $"-e TARGET_IP={targetIp} -e TARGET_PORT={targetPort} " +
                $"--memory=128m --cpus=0.3 detectivectf/web-terminal:latest");

            if (string.IsNullOrWhiteSpace(containerId) || containerId.Length < 12)
                return null;

            var portOutput = await RunDockerCommand($"port {containerId}");
            var hostPort = ParseHostPort(portOutput, 7681);

            if (hostPort == 0) { await RunDockerCommand($"rm -f {containerId}"); return null; }

            return new VMInstance
            {
                ChallengeId = null, UserId = userId, TeamId = teamId,
                ContainerId = containerId, ContainerName = containerName,
                IPAddress = _hostIp, Port = hostPort,
                Status = "running", ExpiresAt = DateTime.UtcNow.AddHours(2)
            };
        }
        catch (Exception ex) { _logger.LogError(ex, "Web terminal hatası"); return null; }
    }
}
