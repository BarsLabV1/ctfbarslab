using System.Security.Claims;
using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/challenges")]
[Authorize]
public class AdminChallengesController : ControllerBase
{
    private readonly IAdminChallengeService _adminChallengeService;

    public AdminChallengesController(IAdminChallengeService adminChallengeService)
    {
        _adminChallengeService = adminChallengeService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult> GetChallenges([FromQuery] int? caseId)
    {
        try
        {
            var result = await _adminChallengeService.GetChallengesAsync(GetUserId(), caseId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] AdminChallengeRequest request)
    {
        try
        {
            var id = await _adminChallengeService.CreateAsync(GetUserId(), request);
            return Ok(new { challengeId = id, message = "Challenge oluşturuldu" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] AdminChallengeRequest request)
    {
        try
        {
            await _adminChallengeService.UpdateAsync(GetUserId(), id, request);
            return Ok(new { message = "Challenge güncellendi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        try
        {
            await _adminChallengeService.DeleteAsync(GetUserId(), id);
            return Ok(new { message = "Challenge silindi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}