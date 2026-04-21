using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.Models;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly AppDbContextNew _context;

    public AdminController(AppDbContextNew context)
    {
        _context = context;
    }

    private async Task<bool> IsAdmin()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var user = await _context.Users.FindAsync(userId);
        return user?.IsAdmin ?? false;
    }

    [HttpDelete("reset-users")]
    public async Task<ActionResult> ResetUsers()
    {
        if (!await IsAdmin()) return Forbid();

        // Admin hariç tüm kullanıcı verilerini temizle
        var nonAdminIds = await _context.Users
            .Where(u => !u.IsAdmin)
            .Select(u => u.Id)
            .ToListAsync();

        _context.TeamMembers.RemoveRange(_context.TeamMembers);
        _context.Teams.RemoveRange(_context.Teams);
        _context.UserChallengeProgresses.RemoveRange(_context.UserChallengeProgresses);
        _context.UserCaseProgresses.RemoveRange(_context.UserCaseProgresses);
        _context.VMInstances.RemoveRange(_context.VMInstances);
        _context.BoardStates.RemoveRange(_context.BoardStates);
        _context.Users.RemoveRange(_context.Users.Where(u => !u.IsAdmin));

        await _context.SaveChangesAsync();
        return Ok(new { message = $"{nonAdminIds.Count} kullanıcı ve tüm ilgili veriler silindi" });
    }

    [HttpGet("check")]
    public async Task<ActionResult> CheckAdmin()
    {
        var isAdmin = await IsAdmin();
        return Ok(new { isAdmin });
    }

    // CASE MANAGEMENT
    [HttpPost("cases")]
    public async Task<ActionResult> CreateCase([FromBody] CreateCaseRequest request)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var caseEntity = new Case
        {
            Title = request.Title,
            Description = request.Description,
            Story = request.Story,
            Difficulty = request.Difficulty,
            TotalPoints = request.TotalPoints,
            ImageUrl = request.ImageUrl,
            IsActive = true
        };

        _context.Cases.Add(caseEntity);
        await _context.SaveChangesAsync();

        return Ok(new { caseId = caseEntity.Id, message = "Vaka oluşturuldu" });
    }

    [HttpPut("cases/{id}")]
    public async Task<ActionResult> UpdateCase(int id, [FromBody] CreateCaseRequest request)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var caseEntity = await _context.Cases.FindAsync(id);
        if (caseEntity == null)
        {
            return NotFound();
        }

        caseEntity.Title = request.Title;
        caseEntity.Description = request.Description;
        caseEntity.Story = request.Story;
        caseEntity.Difficulty = request.Difficulty;
        caseEntity.TotalPoints = request.TotalPoints;
        caseEntity.ImageUrl = request.ImageUrl;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Vaka güncellendi" });
    }

    [HttpDelete("cases/{id}")]
    public async Task<ActionResult> DeleteCase(int id)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var caseEntity = await _context.Cases.FindAsync(id);
        if (caseEntity == null)
        {
            return NotFound();
        }

        _context.Cases.Remove(caseEntity);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Vaka silindi" });
    }

    // CHALLENGE MANAGEMENT
    [HttpPost("challenges")]
    public async Task<ActionResult> CreateChallenge([FromBody] CreateChallengeRequest request)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var challenge = new Challenge
        {
            CaseId = request.CaseId,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Order = request.Order,
            Points = request.Points,
            Flag = request.Flag,
            RequiredChallengeId = request.RequiredChallengeId,
            HasVM = request.HasVM,
            DockerImage = request.DockerImage,
            VMConnectionInfo = request.VMConnectionInfo,
            Files = request.Files,
            Hints = request.Hints,
            UnlockContent = request.UnlockContent
        };

        _context.Challenges.Add(challenge);
        await _context.SaveChangesAsync();

        return Ok(new { challengeId = challenge.Id, message = "Challenge oluşturuldu" });
    }

    [HttpPut("challenges/{id}")]
    public async Task<ActionResult> UpdateChallenge(int id, [FromBody] CreateChallengeRequest request)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
        {
            return NotFound();
        }

        challenge.Title = request.Title;
        challenge.Description = request.Description;
        challenge.Category = request.Category;
        challenge.Order = request.Order;
        challenge.Points = request.Points;
        challenge.Flag = request.Flag;
        challenge.RequiredChallengeId = request.RequiredChallengeId;
        challenge.HasVM = request.HasVM;
        challenge.DockerImage = request.DockerImage;
        challenge.VMConnectionInfo = request.VMConnectionInfo;
        challenge.Files = request.Files;
        challenge.Hints = request.Hints;
        challenge.UnlockContent = request.UnlockContent;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Challenge güncellendi" });
    }

    [HttpDelete("challenges/{id}")]
    public async Task<ActionResult> DeleteChallenge(int id)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
        {
            return NotFound();
        }

        _context.Challenges.Remove(challenge);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Challenge silindi" });
    }

    // FILE UPLOAD
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadFile(IFormFile file)
    {
        if (!await IsAdmin()) return Forbid();
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Dosya seçilmedi" });

        // Max 200MB
        if (file.Length > 200 * 1024 * 1024)
            return BadRequest(new { message = "Dosya 200MB'dan büyük olamaz" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var fileType = ext switch {
            ".mp4" or ".avi" or ".mov" or ".mkv" or ".webm" => "video",
            ".mp3" or ".wav" or ".ogg" or ".m4a"            => "audio",
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "image",
            ".pdf" or ".doc" or ".docx" or ".txt"           => "document",
            ".log" or ".csv" or ".json" or ".xml"           => "log",
            _                                                => "file"
        };

        return Ok(new {
            fileName,
            originalName = file.FileName,
            fileUrl  = $"/uploads/{fileName}",
            fileType,
            size = file.Length
        });
    }

    // EVIDENCE LIST
    [HttpGet("evidences")]
    public async Task<ActionResult> GetEvidences([FromQuery] int? challengeId)
    {
        if (!await IsAdmin()) return Forbid();

        var query = _context.Evidences
            .Include(e => e.Challenge)
            .ThenInclude(c => c.Case)
            .AsQueryable();

        if (challengeId.HasValue)
            query = query.Where(e => e.ChallengeId == challengeId.Value);

        var list = await query.OrderBy(e => e.ChallengeId).ThenBy(e => e.Order)
            .Select(e => new {
                e.Id, e.Title, e.Type, e.FileUrl, e.Description, e.Order,
                e.ChallengeId,
                ChallengeName = e.Challenge.Title,
                CaseName      = e.Challenge.Case.Title
            }).ToListAsync();

        return Ok(list);
    }

    [HttpDelete("evidences/{id}")]
    public async Task<ActionResult> DeleteEvidence(int id)
    {
        if (!await IsAdmin()) return Forbid();

        var ev = await _context.Evidences.FindAsync(id);
        if (ev == null) return NotFound();

        // Dosyayı da sil
        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot",
            ev.FileUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        _context.Evidences.Remove(ev);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Delil silindi" });
    }

    // EVIDENCE MANAGEMENT
    [HttpPost("evidences")]
    public async Task<ActionResult> CreateEvidence([FromBody] CreateEvidenceRequest request)
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var evidence = new Evidence
        {
            ChallengeId = request.ChallengeId,
            Title = request.Title,
            Type = request.Type,
            FileUrl = request.FileUrl,
            Description = request.Description,
            Metadata = request.Metadata,
            Order = request.Order
        };

        _context.Evidences.Add(evidence);
        await _context.SaveChangesAsync();

        return Ok(new { evidenceId = evidence.Id, message = "Delil eklendi" });
    }

    // STATISTICS
    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var totalUsers = await _context.Users.CountAsync();
        var totalCases = await _context.Cases.CountAsync();
        var totalChallenges = await _context.Challenges.CountAsync();
        var totalTeams = await _context.Teams.CountAsync();
        var activeSessions = await _context.VMInstances.CountAsync(v => v.Status == "running");

        var recentSolves = await _context.UserChallengeProgresses
            .Include(p => p.User)
            .Include(p => p.Challenge)
            .Where(p => p.IsSolved)
            .OrderByDescending(p => p.SolvedAt)
            .Take(10)
            .Select(p => new
            {
                Username = p.User.Username,
                ChallengeName = p.Challenge.Title,
                Points = p.Challenge.Points,
                SolvedAt = p.SolvedAt
            })
            .ToListAsync();

        return Ok(new
        {
            totalUsers,
            totalCases,
            totalChallenges,
            totalTeams,
            activeSessions,
            recentSolves
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers()
    {
        if (!await IsAdmin())
        {
            return Forbid();
        }

        var users = await _context.Users
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.TotalScore,
                u.IsAdmin,
                u.PreferredRole,
                u.CreatedAt,
                SolvedChallenges = u.ChallengeProgresses.Count(p => p.IsSolved)
            })
            .ToListAsync();

        return Ok(users);
    }
}

public record CreateCaseRequest(
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl
);

public record CreateChallengeRequest(
    int CaseId,
    string Title,
    string Description,
    string Category,
    int Order,
    int Points,
    string Flag,
    int? RequiredChallengeId,
    bool HasVM,
    string? DockerImage,
    string? VMConnectionInfo,
    string? Files,
    string? Hints,
    string? UnlockContent
);

public record CreateEvidenceRequest(
    int ChallengeId,
    string Title,
    string Type,
    string FileUrl,
    string? Description,
    string? Metadata,
    int Order
);
