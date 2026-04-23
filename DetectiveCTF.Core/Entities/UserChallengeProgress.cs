namespace DetectiveCTF.Core.Entities;
public class UserChallengeProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ChallengeId { get; set; }
    public int? TeamId { get; set; }
    public bool IsSolved { get; set; }
    public int Attempts { get; set; }
    public DateTime? SolvedAt { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    
    // VM bilgileri
    public string? AssignedVMId { get; set; }
    public string? VMConnectionDetails { get; set; } // JSON
    
    // Kullanılan ipuçları (JSON array of hint indexes: [0, 1])
    public string? UsedHints { get; set; }
    
    public User User { get; set; } = null!;
    public Challenge Challenge { get; set; } = null!;
    public Team? Team { get; set; }
}
