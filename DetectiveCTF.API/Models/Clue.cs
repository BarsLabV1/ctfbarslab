namespace DetectiveCTF.API.Models;

public class Clue
{
    public int Id { get; set; }
    public int CaseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsInitial { get; set; } // İlk başta görünür mü?
    public int? RequiredSystemId { get; set; } // Hangi sistem hacklenince açılır?
    public int Order { get; set; }
    
    public Case Case { get; set; } = null!;
    public HackableSystem? RequiredSystem { get; set; }
}
