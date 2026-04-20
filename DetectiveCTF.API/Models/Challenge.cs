namespace DetectiveCTF.API.Models;

public class Challenge
{
    public int Id { get; set; }
    public int CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // OSINT, Web, Forensics, Crypto, Reverse, PWN
    public int Order { get; set; } // Sıralı açılma için
    public int Points { get; set; }
    public string Flag { get; set; } = string.Empty; // CTF{...} formatında
    public int? RequiredChallengeId { get; set; } // Hangi challenge çözülünce açılır
    
    // Docker VM bilgileri
    public bool HasVM { get; set; }
    public string? DockerImage { get; set; }
    public string? VMConnectionInfo { get; set; } // JSON: {ip, port, credentials}
    
    // Dosyalar (video, resim, log, vb.)
    public string? Files { get; set; } // JSON array: [{name, url, type}]
    
    // İpuçları (JSON array: [{text, penaltyPercent}])
    public string? Hints { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public Case Case { get; set; } = null!;
    public Challenge? RequiredChallenge { get; set; }
    public ICollection<Challenge> DependentChallenges { get; set; } = new List<Challenge>();
    public ICollection<UserChallengeProgress> UserProgresses { get; set; } = new List<UserChallengeProgress>();
}
