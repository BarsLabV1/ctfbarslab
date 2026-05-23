namespace DetectiveCTF.Core.Entities;

/// <summary>
/// Docker.DotNet API üzerinden yönetilen aktif VNC masaüstü instance'ları.
/// Her kullanıcıya bir container atanır; noVNC üzerinden tarayıcıdan erişilir.
/// </summary>
public class ActiveInstance
{
    public int Id { get; set; }

    /// <summary>Sahibi olan kullanıcı</summary>
    public int UserId { get; set; }

    /// <summary>Docker container ID (tam SHA256)</summary>
    public string ContainerId { get; set; } = string.Empty;

    /// <summary>Container adı — ctf-user-{UserId}</summary>
    public string ContainerName { get; set; } = string.Empty;

    /// <summary>Host üzerinde map'lenen dış port (30000-32767 aralığı)</summary>
    public int AssignedPort { get; set; }

    /// <summary>Kullanıcıya verilen noVNC erişim URL'i</summary>
    public string VncUrl { get; set; } = string.Empty;

    /// <summary>Container'ın başlatıldığı zaman</summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Otomatik silinme zamanı (varsayılan: 2 saat)</summary>
    public DateTime ExpiryDate { get; set; } = DateTime.UtcNow.AddHours(2);

    /// <summary>running | stopped | expired</summary>
    public string Status { get; set; } = "running";

    // Navigation
    public User? User { get; set; }
}
