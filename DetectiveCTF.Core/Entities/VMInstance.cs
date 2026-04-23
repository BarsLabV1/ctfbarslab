namespace DetectiveCTF.Core.Entities;
public class VMInstance
{
    public int Id { get; set; }
    public int? ChallengeId { get; set; }  // null = web terminal
    public int? UserId { get; set; }
    public int? TeamId { get; set; }
    public string ContainerId { get; set; } = string.Empty;
    public string ContainerName { get; set; } = string.Empty;
    public string IPAddress { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Status { get; set; } = "running"; // running, stopped, error
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    
    public Challenge? Challenge { get; set; }
    public User? User { get; set; }
    public Team? Team { get; set; }
}
