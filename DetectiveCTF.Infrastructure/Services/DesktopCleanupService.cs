using DetectiveCTF.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace DetectiveCTF.Infrastructure.Services;

/// <summary>
/// Her dakika çalışarak süresi dolmuş noVNC container'larını temizler.
/// </summary>
public class DesktopCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DesktopCleanupService> _logger;
    private static readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public DesktopCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<DesktopCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger       = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Desktop Cleanup Service başlatıldı (her {Min} dakikada bir çalışır).",
            _interval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(_interval, stoppingToken);

            try
            {
                using var scope         = _scopeFactory.CreateScope();
                var dockerService       = scope.ServiceProvider.GetRequiredService<IDockerService>();
                await dockerService.CleanupExpiredAsync(stoppingToken);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Desktop temizleme sırasında beklenmeyen hata.");
            }
        }

        _logger.LogInformation("Desktop Cleanup Service durduruldu.");
    }
}
