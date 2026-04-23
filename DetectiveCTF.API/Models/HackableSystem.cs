namespace DetectiveCTF.API.Models;

public class HackableSystem
{
    public int Id { get; set; }
    public int CaseId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // SSH, FTP, WebPanel, Database, Email
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; }
    public string Description { get; set; } = string.Empty;
    
    // Hack bilgileri
    public string CorrectUsername { get; set; } = string.Empty;
    public string CorrectPassword { get; set; } = string.Empty;
    public string? Hint { get; set; }
    
    // Hack sonrası elde edilen bilgi
    public string RewardData { get; set; } = string.Empty; // JSON formatında dosyalar, emailler vs.
    
    public Case Case { get; set; } = null!;
    public ICollection<Clue> UnlockedClues { get; set; } = new List<Clue>();
}
