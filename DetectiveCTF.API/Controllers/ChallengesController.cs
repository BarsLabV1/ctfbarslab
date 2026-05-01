using System.Security.Claims;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChallengesController : ControllerBase
{
    private readonly IChallengeService _challengeService;

    public ChallengesController(IChallengeService challengeService)
    {
        _challengeService = challengeService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("case/{caseId}")]
    public async Task<IActionResult> GetChallenges(int caseId)
    {
        var result = await _challengeService.GetChallengesByCaseAsync(caseId, GetUserId());
        return Ok(result);
    }

    [HttpGet("case/{caseId}/evidences")]
    public async Task<IActionResult> GetCaseEvidences(int caseId,
        [FromServices] DetectiveCTF.Infrastructure.Persistence.AppDbContext db)
    {
        var evidences = await db.Evidences
            .Where(e => e.Challenge.CaseId == caseId)
            .Select(e => new {
                e.Id, e.ChallengeId, e.Title, e.Type, e.FileUrl, e.Description, e.Order
            })
            .OrderBy(e => e.ChallengeId).ThenBy(e => e.Order)
            .ToListAsync();
        return Ok(evidences);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetChallenge(int id)
    {
        try
        {
            var result = await _challengeService.GetChallengeByIdAsync(id, GetUserId());
            if (result == null)
                return NotFound(new { message = "Challenge bulunamadı" });

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitFlag(int id, [FromBody] SubmitFlagRequest request)
    {
        try
        {
            var result = await _challengeService.SubmitFlagAsync(id, GetUserId(), request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/use-hint")]
    public async Task<IActionResult> UseHint(int id, [FromBody] UseHintRequest request)
    {
        try
        {
            var result = await _challengeService.UseHintAsync(id, GetUserId(), request);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/start-vm")]
    public async Task<IActionResult> StartVm(int id)
    {
        try
        {
            var result = await _challengeService.StartVmAsync(id, GetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{id}/start-kali")]
    public async Task<IActionResult> StartKali(int id)
    {
        try
        {
            var result = await _challengeService.StartKaliAsync(id, GetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // Bağımsız Kali masaüstü — challenge'a bağlı değil
    [HttpPost("start-kali-standalone")]
    public async Task<IActionResult> StartKaliStandalone(
        [FromServices] DetectiveCTF.Infrastructure.Services.DockerService dockerService,
        [FromServices] DetectiveCTF.Infrastructure.Persistence.AppDbContext db)
    {
        var userId = GetUserId();
        try
        {
            // Zaten çalışan Kali var mı?
            var existing = await db.VMInstances
                .FirstOrDefaultAsync(v => v.UserId == userId && v.Status == "running"
                    && v.ContainerName.Contains("kali"));
            if (existing != null)
                return Ok(new { kaliPort = existing.Port, ipAddress = existing.IPAddress, message = "Kali zaten çalışıyor" });

            var kali = await dockerService.StartKaliDesktop(userId, null, "");
            if (kali == null)
                return StatusCode(500, new { message = "Kali başlatılamadı" });

            db.VMInstances.Add(kali);
            await db.SaveChangesAsync();

            return Ok(new { kaliPort = kali.Port, ipAddress = kali.IPAddress, message = "Kali masaüstü başlatıldı" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("stop-kali-standalone")]
    public async Task<IActionResult> StopKaliStandalone(
        [FromServices] DetectiveCTF.Infrastructure.Services.DockerService dockerService,
        [FromServices] DetectiveCTF.Infrastructure.Persistence.AppDbContext db)
    {
        var userId = GetUserId();
        var kali = await db.VMInstances
            .FirstOrDefaultAsync(v => v.UserId == userId && v.Status == "running"
                && v.ContainerName.Contains("kali"));
        if (kali == null) return Ok(new { message = "Çalışan Kali yok" });

        await dockerService.StopVM(kali);
        kali.Status = "stopped";
        await db.SaveChangesAsync();
        return Ok(new { message = "Kali durduruldu" });
    }

    [HttpPost("{id}/stop-vm")]
    public async Task<IActionResult> StopVm(int id)
    {
        try
        {
            var message = await _challengeService.StopVmAsync(id, GetUserId());
            return Ok(new { message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }
}