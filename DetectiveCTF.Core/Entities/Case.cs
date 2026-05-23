namespace DetectiveCTF.Core.Entities;

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

    // Senaryo bazlı VM — tek container, tüm sorular bu makineden çözülür
    public bool HasVM { get; set; } = false;
    public string? DockerImage { get; set; }
    public string? Domain { get; set; }
    
    public ICollection<Challenge> Challenges { get; set; } = new List<Challenge>();
    public ICollection<UserCaseProgress> UserProgresses { get; set; } = new List<UserCaseProgress>();
    public ICollection<TeamCaseProgress> TeamProgresses { get; set; } = new List<TeamCaseProgress>();
}
