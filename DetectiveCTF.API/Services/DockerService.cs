using System.Diagnostics;
using System.Text.Json;
using DetectiveCTF.API.Models;

namespace DetectiveCTF.API.Services;

public class DockerService
{
    private readonly ILogger<DockerService> _logger;
    private const string HOST_IP = "127.0.0.1"; // Değiştir: sunucu IP'si

    public DockerService(ILogger<DockerService> logger)
    {
        _logger = logger;
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
        var error  = await process.StandardError.ReadToEndAsync();

        if (!string.IsNullOrEmpty(error))
            _logger.LogWarning("Docker stderr: {Error}", error);

        return output.Trim();
    }

    public async Task<VMInstance?> StartVMForChallenge(Challenge challenge, int? userId, int? teamId)
    {
        try
        {
            if (!challenge.HasVM || string.IsNullOrEmpty(challenge.DockerImage))
                return null;

            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_{challenge.Id}_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            // Image var mı kontrol et, yoksa pull et
            var imageCheck = await RunDockerCommand($"images -q {challenge.DockerImage}");
            if (string.IsNullOrEmpty(imageCheck))
            {
                _logger.LogInformation("Pulling image {Image}...", challenge.DockerImage);
                await RunDockerCommand($"pull {challenge.DockerImage}");
            }

            // Container başlat — random host port ile
            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} -P --memory=256m --cpus=0.5 {challenge.DockerImage}");

            if (string.IsNullOrEmpty(containerId) || containerId.Length < 12)
            {
                _logger.LogError("Container başlatılamadı: {Output}", containerId);
                return null;
            }

            // Port mapping'i al
            var portOutput = await RunDockerCommand($"port {containerId}");
            // Örnek çıktı: "22/tcp -> 0.0.0.0:32768"
            var hostPort = ParseHostPort(portOutput);

            if (hostPort == 0)
            {
                _logger.LogError("Port alınamadı: {Output}", portOutput);
                // Container'ı temizle
                await RunDockerCommand($"rm -f {containerId}");
                return null;
            }

            _logger.LogInformation("Container başlatıldı: {Name} → {IP}:{Port}", containerName, HOST_IP, hostPort);

            return new VMInstance
            {
                ChallengeId  = challenge.Id,
                UserId       = userId,
                TeamId       = teamId,
                ContainerId  = containerId,
                ContainerName = containerName,
                IPAddress    = HOST_IP,
                Port         = hostPort,
                Status       = "running",
                ExpiresAt    = DateTime.UtcNow.AddHours(2)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VM başlatma hatası: Challenge {Id}", challenge.Id);
            return null;
        }
    }

    public async Task<VMInstance?> StartWebTerminal(int? userId, int? teamId, string targetIp, int targetPort)
    {
        try
        {
            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_terminal_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            // Web terminal container başlat
            // TARGET_IP ve TARGET_PORT env variable olarak geç
            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} -P " +
                $"-e TARGET_IP={targetIp} -e TARGET_PORT={targetPort} " +
                $"--memory=128m --cpus=0.3 " +
                $"detectivectf/web-terminal:latest");

            if (string.IsNullOrEmpty(containerId) || containerId.Length < 12)
                return null;

            var portOutput = await RunDockerCommand($"port {containerId}");
            var hostPort = ParseHostPort(portOutput, 7681);

            if (hostPort == 0)
            {
                await RunDockerCommand($"rm -f {containerId}");
                return null;
            }

            return new VMInstance
            {
                ChallengeId  = null,  // web terminal
                UserId       = userId,
                TeamId       = teamId,
                ContainerId  = containerId,
                ContainerName = containerName,
                IPAddress    = HOST_IP,
                Port         = hostPort,
                Status       = "running",
                ExpiresAt    = DateTime.UtcNow.AddHours(2)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Web terminal başlatma hatası");
            return null;
        }
    }

    public async Task<VMInstance?> StartKaliDesktop(int? userId, int? teamId, string targetIp)
    {
        try
        {
            var suffix = userId.HasValue ? $"u{userId}" : $"t{teamId}";
            var containerName = $"ctf_kali_{suffix}_{Guid.NewGuid().ToString()[..6]}";

            var containerId = await RunDockerCommand(
                $"run -d --name {containerName} -P " +
                $"-e TARGET_IP={targetIp} " +
                $"-e VNC_PW=kali123 " +
                $"--memory=2g --cpus=1.5 --shm-size=512m " +
                $"kasmweb/kali-rolling-desktop:1.15.0");

            if (string.IsNullOrEmpty(containerId) || containerId.Length < 12)
                return null;

            await Task.Delay(4000); // Kali başlaması için bekle

            var portOutput = await RunDockerCommand($"port {containerId}");
            var hostPort = ParseHostPort(portOutput, 6901); // Kasm uses 6901

            if (hostPort == 0)
            {
                await RunDockerCommand($"rm -f {containerId}");
                return null;
            }

            _logger.LogInformation("Kali desktop başlatıldı: {Name} → port {Port}", containerName, hostPort);

            return new VMInstance
            {
                ChallengeId   = null,
                UserId        = userId,
                TeamId        = teamId,
                ContainerId   = containerId,
                ContainerName = containerName,
                IPAddress     = HOST_IP,
                Port          = hostPort,
                Status        = "running",
                ExpiresAt     = DateTime.UtcNow.AddHours(4)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kali desktop başlatma hatası");
            return null;
        }
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
            _logger.LogError(ex, "VM durdurma hatası: {Id}", vm.ContainerId);
            return false;
        }
    }

    public async Task<string> GetVMStatus(string containerId)
    {
        try
        {
            var status = await RunDockerCommand(
                $"inspect -f {{{{.State.Status}}}} {containerId}");
            return status.Trim('\'', '"', '\n');
        }
        catch { return "error"; }
    }

    // "22/tcp -> 0.0.0.0:32768" → 32768
    private int ParseHostPort(string portOutput, int containerPort = 22)
    {
        if (string.IsNullOrEmpty(portOutput)) return 0;

        foreach (var line in portOutput.Split('\n'))
        {
            if (line.Contains("->"))
            {
                var parts = line.Split("->");
                if (parts.Length == 2)
                {
                    var hostPart = parts[1].Trim(); // "0.0.0.0:32768"
                    var colonIdx = hostPart.LastIndexOf(':');
                    if (colonIdx >= 0 && int.TryParse(hostPart[(colonIdx + 1)..], out var port))
                        return port;
                }
            }
        }
        return 0;
    }
}
