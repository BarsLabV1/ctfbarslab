using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DetectiveCTF.Infrastructure.Services;

/// <summary>
/// Her 10 dakikada bir çalışarak süresi dolmuş VM container'larını durdurur ve DB'den temizler.
/// </summary>
public class VmExpiryCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<VmExpiryCleanupService> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(10);

    public VmExpiryCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<VmExpiryCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("VM Expiry Cleanup Service başlatıldı.");

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(_interval, stoppingToken);

            try
            {
                await CleanupExpiredVmsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "VM temizleme sırasında hata oluştu.");
            }
        }
    }

    private async Task CleanupExpiredVmsAsync(CancellationToken ct)
    {
        using var scope  = _scopeFactory.CreateScope();
        var db           = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dockerService = scope.ServiceProvider.GetRequiredService<DockerService>();

        var now     = DateTime.UtcNow;
        var expired = await db.VMInstances
            .Where(v => v.Status == "running" && v.ExpiresAt != null && v.ExpiresAt <= now)
            .ToListAsync(ct);

        if (expired.Count == 0) return;

        _logger.LogInformation("{Count} adet süresi dolmuş VM temizleniyor...", expired.Count);

        foreach (var vm in expired)
        {
            try
            {
                await dockerService.StopVM(vm);
                vm.Status = "stopped";
                _logger.LogInformation("VM durduruldu: {Name}", vm.ContainerName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "VM durdurulamadı: {Name}", vm.ContainerName);
                // Yine de DB'de stopped olarak işaretle
                vm.Status = "stopped";
            }
        }

        await db.SaveChangesAsync(ct);
        _logger.LogInformation("{Count} VM temizlendi.", expired.Count);
    }
}
