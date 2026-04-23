namespace DetectiveCTF.Core.Entities;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public int TotalScore { get; set; }
    public bool IsAdmin { get; set; } = false;
    public string? PreferredRole { get; set; } // OSINT, Web, Forensics, etc.
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<UserCaseProgress> CaseProgresses { get; set; } = new List<UserCaseProgress>();
    public ICollection<UserChallengeProgress> ChallengeProgresses { get; set; } = new List<UserChallengeProgress>();
    public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
    public ICollection<Team> LeadingTeams { get; set; } = new List<Team>();
}
