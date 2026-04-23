using System.Security.Claims;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/stats")]
[Authorize]
public class AdminStatsController : ControllerBase
{
    private readonly IAdminStatsService _adminStatsService;

    public AdminStatsController(IAdminStatsService adminStatsService)
    {
        _adminStatsService = adminStatsService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var result = await _adminStatsService.GetStatsAsync(GetUserId());
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}