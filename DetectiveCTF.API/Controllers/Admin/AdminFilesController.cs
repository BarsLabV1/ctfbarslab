using System.Security.Claims;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/files")]
[Authorize]
public class AdminFilesController : ControllerBase
{
    private readonly IAdminFileService _adminFileService;

    public AdminFilesController(IAdminFileService adminFileService)
    {
        _adminFileService = adminFileService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try
        {
            var result = await _adminFileService.UploadAsync(GetUserId(), file);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}