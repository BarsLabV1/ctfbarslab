using Docker.DotNet;
using Docker.DotNet.Models;
using DetectiveCTF.Core.Interfaces;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DetectiveCTF.Infrastructure.Services;

/// <summary>
/// Docker.DotNet API kullanarak noVNC masaüstü container'larını yönetir.
/// Her kullanıcıya ctf-user-{userId} adında bir container atanır.
/// noVNC portu (6080) host üzerinde 30000-32767 aralığında dinamik bir porta map'lenir.
/// </summary>
public class DesktopDockerService : IDockerService
{
    private readonly IDockerClient _docker;
    private readonly AppDbContext _db;
    private readonly ILogger<DesktopDockerService> _logger;
    private readonly string _hostIp;
    private readonly string _imageName;
    private readonly int _portRangeStart;
    private readonly int _portRangeEnd;
    private readonly int _sessionHours;

    // noVNC container içi port
    private const int VNC_CONTAINER_PORT = 6080;

    // Kaynak limitleri
    private const long MEMORY_LIMIT_BYTES = 512L * 1024 * 1024; // 512 MB

    public DesktopDockerService(
        AppDbContext db,
        ILogger<DesktopDockerService> logger,
        IConfiguration configuration)
    {
        _db           = db;
        _logger       = logger;
        _hostIp       = configuration["Docker:HostIp"]        ?? "127.0.0.1";
        _imageName    = configuration["Docker:DesktopImage"]  ?? "ctf-desktop:latest";
        _portRangeStart = int.Parse(configuration["Docker:PortRangeStart"] ?? "30000");
        _portRangeEnd   = int.Parse(configuration["Docker:PortRangeEnd"]   ?? "32767");
        _sessionHours   = int.Parse(configuration["Docker:SessionHours"]   ?? "2");

        // Docker socket üzerinden bağlan
        var socketPath = configuration["Docker:SocketPath"] ?? "auto";
        _docker = new DockerClientConfiguration(ResolveDockerUri(socketPath))
            .CreateClient();
    }

    private static Uri ResolveDockerUri(string socketPath)
    {
        if (string.IsNullOrWhiteSpace(socketPath) || socketPath.Equals("auto", StringComparison.OrdinalIgnoreCase))
        {
            return OperatingSystem.IsWindows()
                ? new Uri("npipe://./pipe/docker_engine")
                : new Uri("unix:///var/run/docker.sock");
        }

        return new Uri(socketPath);
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────

    public async Task<ActiveInstance> StartDesktopAsync(int userId, CancellationToken ct = default)
    {
        // Zaten çalışan bir instance var mı?
        var existing = await _db.ActiveInstances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == "running", ct);

        if (existing != null)
        {
            _logger.LogInformation("Kullanıcı {UserId} için mevcut instance döndürülüyor: {Name}",
                userId, existing.ContainerName);
            return existing;
        }

        // Boş port bul
        var port = await FindFreePortAsync(ct);

        var containerName = $"ctf-user-{userId}";

        // Varsa eski (stopped) container'ı temizle
        await RemoveContainerIfExistsAsync(containerName, ct);

        // Image var mı kontrol et
        await EnsureImageExistsAsync(ct);

        // Container oluştur ve başlat
        var containerId = await CreateAndStartContainerAsync(containerName, port, ct);

        var instance = new ActiveInstance
        {
            UserId        = userId,
            ContainerId   = containerId,
            ContainerName = containerName,
            AssignedPort  = port,
            VncUrl        = $"http://{_hostIp}:{port}/vnc_lite.html",
            CreatedAt     = DateTime.UtcNow,
            ExpiryDate    = DateTime.UtcNow.AddHours(_sessionHours),
            Status        = "running"
        };

        _db.ActiveInstances.Add(instance);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Desktop başlatıldı — kullanıcı: {UserId}, container: {Name}, port: {Port}, url: {Url}",
            userId, containerName, port, instance.VncUrl);

        return instance;
    }

    public async Task StopAndRemoveAsync(string containerId, CancellationToken ct = default)
    {
        try
        {
            await _docker.Containers.StopContainerAsync(
                containerId,
                new ContainerStopParameters { WaitBeforeKillSeconds = 5 },
                ct);
        }
        catch (DockerContainerNotFoundException)
        {
            // Zaten yok, sorun değil
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Container durdurulurken hata: {Id}", containerId);
        }

        try
        {
            await _docker.Containers.RemoveContainerAsync(
                containerId,
                new ContainerRemoveParameters { Force = true },
                ct);
        }
        catch (DockerContainerNotFoundException) { }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Container silinirken hata: {Id}", containerId);
        }

        // DB kaydını güncelle
        var instance = await _db.ActiveInstances
            .FirstOrDefaultAsync(a => a.ContainerId == containerId, ct);

        if (instance != null)
        {
            instance.Status = "stopped";
            await _db.SaveChangesAsync(ct);
        }

        _logger.LogInformation("Container durduruldu ve silindi: {Id}", containerId);
    }

    public async Task<string> GetContainerStatusAsync(string containerId, CancellationToken ct = default)
    {
        try
        {
            var info = await _docker.Containers.InspectContainerAsync(containerId, ct);
            return info.State.Status; // "running", "exited", "paused" vb.
        }
        catch (DockerContainerNotFoundException)
        {
            return "not_found";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Container durumu alınamadı: {Id}", containerId);
            return "error";
        }
    }

    public async Task CleanupExpiredAsync(CancellationToken ct = default)
    {
        var now     = DateTime.UtcNow;
        var expired = await _db.ActiveInstances
            .Where(a => a.Status == "running" && a.ExpiryDate <= now)
            .ToListAsync(ct);

        if (expired.Count == 0) return;

        _logger.LogInformation("{Count} süresi dolmuş instance temizleniyor...", expired.Count);

        foreach (var instance in expired)
        {
            try
            {
                await StopAndRemoveAsync(instance.ContainerId, ct);
                instance.Status = "expired";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Instance temizlenemedi: {Name}", instance.ContainerName);
                instance.Status = "error";
            }
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("{Count} instance temizlendi.", expired.Count);
    }

    // ─────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────

    /// <summary>
    /// 30000-32767 aralığında hem DB'de hem OS'ta kullanılmayan bir port bulur.
    /// </summary>
    private async Task<int> FindFreePortAsync(CancellationToken ct)
    {
        // DB'de kullanılan portları al
        var usedPorts = await _db.ActiveInstances
            .Where(a => a.Status == "running")
            .Select(a => a.AssignedPort)
            .ToHashSetAsync(ct);

        // OS'ta dinlenen portları al
        var listeners = System.Net.NetworkInformation.IPGlobalProperties
            .GetIPGlobalProperties()
            .GetActiveTcpListeners()
            .Select(ep => ep.Port)
            .ToHashSet();

        for (var port = _portRangeStart; port <= _portRangeEnd; port++)
        {
            if (!usedPorts.Contains(port) && !listeners.Contains(port))
                return port;
        }

        throw new InvalidOperationException(
            $"Boş port bulunamadı ({_portRangeStart}-{_portRangeEnd} aralığı dolu).");
    }

    /// <summary>
    /// Image yoksa pull eder.
    /// </summary>
    private async Task EnsureImageExistsAsync(CancellationToken ct)
    {
        try
        {
            var images = await _docker.Images.ListImagesAsync(
                new ImagesListParameters { Filters = new Dictionary<string, IDictionary<string, bool>>
                {
                    ["reference"] = new Dictionary<string, bool> { [_imageName] = true }
                }}, ct);

            if (images.Count > 0) return;

            _logger.LogInformation("Image bulunamadı, pull ediliyor: {Image}", _imageName);

            await _docker.Images.CreateImageAsync(
                new ImagesCreateParameters { FromImage = _imageName },
                null,
                new Progress<JSONMessage>(msg =>
                {
                    if (!string.IsNullOrWhiteSpace(msg.Status))
                        _logger.LogDebug("Pull: {Status}", msg.Status);
                }),
                ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Image pull hatası: {Image}", _imageName);
            throw;
        }
    }

    /// <summary>
    /// Aynı isimde eski container varsa siler.
    /// </summary>
    private async Task RemoveContainerIfExistsAsync(string name, CancellationToken ct)
    {
        try
        {
            var containers = await _docker.Containers.ListContainersAsync(
                new ContainersListParameters
                {
                    All     = true,
                    Filters = new Dictionary<string, IDictionary<string, bool>>
                    {
                        ["name"] = new Dictionary<string, bool> { [$"/{name}"] = true }
                    }
                }, ct);

            foreach (var c in containers)
            {
                await _docker.Containers.RemoveContainerAsync(
                    c.ID,
                    new ContainerRemoveParameters { Force = true },
                    ct);
                _logger.LogInformation("Eski container silindi: {Name}", name);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Eski container temizlenirken hata: {Name}", name);
        }
    }

    /// <summary>
    /// Container'ı oluşturur, başlatır ve ID'sini döndürür.
    /// </summary>
    private async Task<string> CreateAndStartContainerAsync(
        string containerName, int hostPort, CancellationToken ct)
    {
        var portBindings = new Dictionary<string, IList<PortBinding>>
        {
            [$"{VNC_CONTAINER_PORT}/tcp"] = new List<PortBinding>
            {
                new PortBinding { HostIP = "0.0.0.0", HostPort = hostPort.ToString() }
            }
        };

        var exposedPorts = new Dictionary<string, EmptyStruct>
        {
            [$"{VNC_CONTAINER_PORT}/tcp"] = default
        };

        var response = await _docker.Containers.CreateContainerAsync(
            new CreateContainerParameters
            {
                Name  = containerName,
                Image = _imageName,

                ExposedPorts = exposedPorts,

                HostConfig = new HostConfig
                {
                    PortBindings = portBindings,

                    // ── Kaynak limitleri ──
                    Memory      = MEMORY_LIMIT_BYTES,
                    MemorySwap  = MEMORY_LIMIT_BYTES, // swap = memory → swap yok
                    NanoCPUs    = 500_000_000L,        // 0.5 CPU = 500m

                    // Güvenlik — container'ın host'a zarar vermesini engelle
                    ReadonlyRootfs = false,
                    CapDrop        = new List<string> { "ALL" },
                    CapAdd         = new List<string> { "CHOWN", "SETUID", "SETGID", "DAC_OVERRIDE" },
                    SecurityOpt    = new List<string> { "no-new-privileges" },

                    // Restart policy — crash'te yeniden başlatma
                    RestartPolicy = new RestartPolicy { Name = RestartPolicyKind.No },
                },

                // Ortam değişkenleri — noVNC / VNC ayarları
                Env = new List<string>
                {
                    "VNC_RESOLUTION=1280x720",
                    "VNC_COL_DEPTH=24",
                    "VNC_PW=ctf2024",          // Basit şifre — production'da config'den al
                    "DISPLAY=:1"
                }
            }, ct);

        if (response.Warnings?.Count > 0)
            _logger.LogWarning("Container oluşturma uyarıları: {Warnings}",
                string.Join(", ", response.Warnings));

        // Container'ı başlat
        var started = await _docker.Containers.StartContainerAsync(
            response.ID,
            new ContainerStartParameters(),
            ct);

        if (!started)
            throw new Exception($"Container başlatılamadı: {containerName}");

        return response.ID;
    }
}
