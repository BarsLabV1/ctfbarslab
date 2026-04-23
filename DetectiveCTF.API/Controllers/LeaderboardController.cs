using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

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
}