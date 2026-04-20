using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly AppDbContextNew _context;

    public LeaderboardController(AppDbContextNew context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetLeaderboard()
    {
        var leaderboard = await _context.Users
            .OrderByDescending(u => u.TotalScore)
            .Take(10)
            .Select(u => new
            {
                u.Username,
                u.TotalScore,
                SolvedChallenges = u.ChallengeProgresses.Count(cp => cp.IsSolved)
            })
            .ToListAsync();

        return Ok(leaderboard);
    }
}
