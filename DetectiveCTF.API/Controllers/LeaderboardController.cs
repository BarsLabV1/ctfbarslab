using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILeaderboardService _leaderboardService;

    public LeaderboardController(ILeaderboardService leaderboardService)
    {
        _leaderboardService = leaderboardService;
    }

    [HttpGet]
    public async Task<ActionResult> GetLeaderboard()
    {
        var result = await _leaderboardService.GetLeaderboardAsync();
        return Ok(result);
    }

    [HttpGet("teams")]
    public async Task<ActionResult> GetTeamLeaderboard(
        [FromServices] DetectiveCTF.Infrastructure.Persistence.AppDbContext db)
    {
        var teams = await db.Teams
            .Where(t => t.IsActive)
            .Include(t => t.Members)
            .OrderByDescending(t => t.TotalScore)
            .Take(10)
            .Select(t => new {
                name        = t.Name,
                totalScore  = t.TotalScore,
                memberCount = t.Members.Count,
                solvedChallenges = db.UserChallengeProgresses
                    .Where(p => t.Members.Select(m => m.UserId).Contains(p.UserId) && p.IsSolved)
                    .Select(p => p.ChallengeId).Distinct().Count()
            })
            .ToListAsync();
        return Ok(teams);
    }
}