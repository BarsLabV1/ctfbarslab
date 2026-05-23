using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.Infrastructure.Persistence;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminController(AppDbContext context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpDelete("reset-users")]
    public async Task<ActionResult> ResetUsers()
    {
        var nonAdminCount = await _context.Users.CountAsync(u => !u.IsAdmin);

        _context.TeamMembers.RemoveRange(_context.TeamMembers);
        _context.Teams.RemoveRange(_context.Teams);
        _context.UserChallengeProgresses.RemoveRange(_context.UserChallengeProgresses);
        _context.UserCaseProgresses.RemoveRange(_context.UserCaseProgresses);
        _context.VMInstances.RemoveRange(_context.VMInstances);
        _context.BoardStates.RemoveRange(_context.BoardStates);
        _context.Users.RemoveRange(_context.Users.Where(u => !u.IsAdmin));

        await _context.SaveChangesAsync();
        return Ok(new { message = $"{nonAdminCount} kullanıcı ve tüm ilgili veriler silindi" });
    }

    [HttpGet("check")]
    [AllowAnonymous]
    public IActionResult CheckAdmin()
    {
        var isAdmin = User.IsInRole("Admin");
        return Ok(new { isAdmin });
    }

    [HttpGet("docker-test")]
    public async Task<ActionResult> DockerTest()
    {
        try
        {
            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName               = "docker",
                Arguments              = "ps --format {{.Names}}",
                RedirectStandardOutput = true,
                RedirectStandardError  = true,
                UseShellExecute        = false,
                CreateNoWindow         = true
            };
            using var p = System.Diagnostics.Process.Start(psi);
            if (p == null) return Ok(new { error = "Process null" });
            await p.WaitForExitAsync();
            return Ok(new
            {
                stdout   = (await p.StandardOutput.ReadToEndAsync()).Trim(),
                stderr   = (await p.StandardError.ReadToEndAsync()).Trim(),
                exitCode = p.ExitCode
            });
        }
        catch (Exception ex) { return Ok(new { error = ex.Message }); }
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Dosya seçilmedi" });

        if (file.Length > 200 * 1024 * 1024)
            return BadRequest(new { message = "Dosya 200MB'dan büyük olamaz" });

        // Güvenli dosya adı — orijinal adı kullanma
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

        // İzin verilen uzantılar
        var allowed = new HashSet<string>
        {
            ".mp4", ".avi", ".mov", ".mkv", ".webm",
            ".mp3", ".wav", ".ogg", ".m4a",
            ".jpg", ".jpeg", ".png", ".gif", ".webp",
            ".pdf", ".doc", ".docx", ".txt",
            ".log", ".csv", ".json", ".xml", ".pcap", ".zip"
        };

        if (!allowed.Contains(ext))
            return BadRequest(new { message = $"İzin verilmeyen dosya türü: {ext}" });

        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await file.CopyToAsync(stream);

        var fileType = ext switch
        {
            ".mp4" or ".avi" or ".mov" or ".mkv" or ".webm" => "video",
            ".mp3" or ".wav" or ".ogg" or ".m4a"            => "audio",
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "image",
            ".pdf" or ".doc" or ".docx" or ".txt"           => "document",
            ".log" or ".csv" or ".json" or ".xml"           => "log",
            _                                                => "file"
        };

        return Ok(new
        {
            fileName,
            originalName = file.FileName,
            fileUrl      = $"/uploads/{fileName}",
            fileType,
            size         = file.Length
        });
    }

    [HttpGet("stats")]
    public async Task<ActionResult> GetStats()
    {
        return Ok(new
        {
            totalUsers      = await _context.Users.CountAsync(),
            totalCases      = await _context.Cases.CountAsync(),
            totalChallenges = await _context.Challenges.CountAsync(),
            totalTeams      = await _context.Teams.CountAsync(),
            activeSessions  = await _context.VMInstances.CountAsync(v => v.Status == "running"),
        });
    }

    [HttpGet("users")]
    public async Task<ActionResult> GetUsers()
    {
        var users = await _context.Users
            .Select(u => new
            {
                u.Id, u.Username, u.Email, u.TotalScore, u.IsAdmin, u.CreatedAt,
                SolvedChallenges = u.ChallengeProgresses.Count(p => p.IsSolved)
            })
            .ToListAsync();
        return Ok(users);
    }
}
