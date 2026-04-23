using System.Security.Claims;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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