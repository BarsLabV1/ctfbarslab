using DetectiveCTF.Core.Entities;

namespace DetectiveCTF.Core.Interfaces;

/// <summary>
/// Docker Engine API üzerinden container yaşam döngüsünü yöneten servis.
/// </summary>
public interface IDockerService
{
    /// <summary>
    /// Kullanıcı için yeni bir noVNC masaüstü container'ı başlatır.
    /// Zaten çalışan bir instance varsa onu döndürür.
    /// </summary>
    Task<ActiveInstance> StartDesktopAsync(int userId, CancellationToken ct = default);

    /// <summary>
    /// Belirtilen container'ı durdurur ve siler.
    /// </summary>
    Task StopAndRemoveAsync(string containerId, CancellationToken ct = default);

    /// <summary>
    /// Container'ın Docker üzerindeki gerçek durumunu döndürür.
    /// </summary>
    Task<string> GetContainerStatusAsync(string containerId, CancellationToken ct = default);

    /// <summary>
    /// Süresi dolmuş tüm instance'ları durdurur ve siler.
    /// Background service tarafından çağrılır.
    /// </summary>
    Task CleanupExpiredAsync(CancellationToken ct = default);
}
