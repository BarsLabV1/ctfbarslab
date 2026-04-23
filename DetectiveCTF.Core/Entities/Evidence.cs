namespace DetectiveCTF.Core.Entities;

public class Evidence
{
    public int Id { get; set; }
    public int ChallengeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // video, image, audio, document, log
    public string FileUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Metadata { get; set; } // JSON: {duration, resolution, timestamp, etc}
    public int Order { get; set; }
    
    public Challenge Challenge { get; set; } = null!;
}
