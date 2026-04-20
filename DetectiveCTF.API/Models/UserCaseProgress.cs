namespace DetectiveCTF.API.Models;

public class UserCaseProgress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CaseId { get; set; }
    public bool IsCompleted { get; set; }
    public int Score { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    // Hacklenmiş sistemler
    public string HackedSystemIds { get; set; } = string.Empty; // Virgülle ayrılmış ID'ler
    
    // Bulunan ipuçları
    public string DiscoveredClueIds { get; set; } = string.Empty; // Virgülle ayrılmış ID'ler
    
    public User User { get; set; } = null!;
    public Case Case { get; set; } = null!;
}
