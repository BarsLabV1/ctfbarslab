namespace DetectiveCTF.Core.Entities;

public class BoardState
{
    public int Id { get; set; }
    public int CaseId { get; set; }
    public int? TeamId { get; set; }   // null = solo
    public int? UserId { get; set; }   // null = team board
    public string StateJson { get; set; } = "{}"; // {notes:[], strings:[], suspects:[]}
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Case Case { get; set; } = null!;
}
