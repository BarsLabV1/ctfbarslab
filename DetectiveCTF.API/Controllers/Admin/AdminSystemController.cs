using System.Security.Claims;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/system")]
[Authorize]
public class AdminSystemController : ControllerBase
{
    private readonly IAdminSystemService _adminSystemService;

    public AdminSystemController(IAdminSystemService adminSystemService)
    {
        _adminSystemService = adminSystemService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckAdmin()
    {
        var isAdmin = await _adminSystemService.CheckAdminAsync(GetUserId());
        return Ok(new { isAdmin });
    }

    [HttpDelete("reset-users")]
    public async Task<IActionResult> ResetUsers()
    {
        try
        {
            var message = await _adminSystemService.ResetUsersAsync(GetUserId());
            return Ok(new { message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }
}