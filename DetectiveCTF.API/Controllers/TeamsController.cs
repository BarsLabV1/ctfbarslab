using System.Security.Claims;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly ITeamService _teamService;

    public TeamsController(ITeamService teamService)
    {
        _teamService = teamService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpPost("create")]
    public async Task<ActionResult> CreateTeam([FromBody] CreateTeamRequest request)
    {
        try
        {
            var result = await _teamService.CreateTeamAsync(GetUserId(), request);
            return Ok(new { teamId = result.TeamId, inviteCode = result.InviteCode, message = result.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("join-by-code")]
    public async Task<ActionResult> JoinTeamByCode([FromBody] JoinByCodeRequest request)
    {
        try
        {
            var result = await _teamService.JoinTeamByCodeAsync(GetUserId(), request);
            return Ok(new { teamId = result.TeamId, teamName = result.TeamName, message = result.Message });
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

    [HttpPost("{teamId}/join")]
    public async Task<ActionResult> JoinTeam(int teamId, [FromBody] JoinTeamRequest request)
    {
        try
        {
            var result = await _teamService.JoinTeamAsync(GetUserId(), teamId, request);
            return Ok(new { teamId = result.TeamId, teamName = result.TeamName, message = result.Message });
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

    [HttpGet]
    public async Task<ActionResult> GetTeams()
    {
        var result = await _teamService.GetTeamsAsync();
        return Ok(result);
    }

    [HttpDelete("{teamId}/kick/{userId}")]
    public async Task<ActionResult> KickMember(int teamId, int userId)
    {
        try
        {
            var result = await _teamService.KickMemberAsync(GetUserId(), teamId, userId);
            return Ok(new { message = result.Message });
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

    [HttpGet("my-team")]
    public async Task<ActionResult> GetMyTeam()
    {
        var result = await _teamService.GetMyTeamAsync(GetUserId());
        return Ok(result);
    }

    [HttpDelete("leave")]
    public async Task<ActionResult> LeaveTeam()
    {
        try
        {
            var result = await _teamService.LeaveTeamAsync(GetUserId());
            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("taken-roles/{inviteCode}")]
    public async Task<ActionResult> GetTakenRoles(string inviteCode)
    {
        var roles = await _teamService.GetTakenRolesAsync(inviteCode);
        return Ok(roles);
    }
}