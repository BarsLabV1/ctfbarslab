namespace DetectiveCTF.API.Models;

public class Case
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Story { get; set; } = string.Empty;
    public int Difficulty { get; set; } // 1-5
    public int TotalPoints { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Senaryo bazlı VM — tüm sorular bu makineden çözülür
    public bool HasVM { get; set; } = false;
    public string? DockerImage { get; set; }   // örn: "ctf/kan-ve-kod:latest"
    public string? Domain { get; set; }         // örn: "kanvekod.ctf" (opsiyonel)
    
    public ICollection<Challenge> Challenges { get; set; } = new List<Challenge>();
    public ICollection<UserCaseProgress> UserProgresses { get; set; } = new List<UserCaseProgress>();
    public ICollection<TeamCaseProgress> TeamProgresses { get; set; } = new List<TeamCaseProgress>();
}
