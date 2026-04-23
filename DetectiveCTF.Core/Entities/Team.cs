namespace DetectiveCTF.Core.Entities;

public class Team
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int LeaderId { get; set; }
    public int MaxMembers { get; set; } = 4;
    public int TotalScore { get; set; }
    public bool IsActive { get; set; } = true;
    public string InviteCode { get; set; } = string.Empty; // Davet kodu
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public User Leader { get; set; } = null!;
    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<TeamCaseProgress> CaseProgresses { get; set; } = new List<TeamCaseProgress>();
}

public class TeamMember
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int UserId { get; set; }
    public string Role { get; set; } = string.Empty; // OSINT, Web, Forensics, Crypto, Reverse, PWN, Network
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    
    public Team Team { get; set; } = null!;
    public User User { get; set; } = null!;
}

public class TeamCaseProgress
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public int CaseId { get; set; }
    public bool IsCompleted { get; set; }
    public int Score { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    
    public Team Team { get; set; } = null!;
    public Case Case { get; set; } = null!;
}
