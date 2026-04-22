namespace DetectiveCTF.API.Models;

/// <summary>
/// Admin tarafından panoya eklenen özel kartlar.
/// Tip: note | photo | video | document | terminal | website
/// </summary>
public class BoardCard
{
    public int Id { get; set; }
    public int CaseId { get; set; }

    // Görünüm
    public string Type { get; set; } = "note";   // note|photo|video|document|terminal|website
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }          // metin içeriği
    public string? FileUrl { get; set; }          // yüklenen dosya
    public string? ExternalUrl { get; set; }      // web sitesi URL'i
    public string? DockerImage { get; set; }      // terminal için docker image

    // Pano pozisyonu
    public int PosX { get; set; } = 400;
    public int PosY { get; set; } = 400;
    public float Rotation { get; set; } = 0;
    public string? Color { get; set; }            // not rengi

    // Kilit — hangi challenge çözülünce açılır (null = baştan açık)
    public int? UnlockedByChallenge { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Case Case { get; set; } = null!;
}
