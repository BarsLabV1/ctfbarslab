using System.Security.Claims;
using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/evidences")]
[Authorize]
public class AdminEvidencesController : ControllerBase
{
    private readonly IAdminEvidenceService _adminEvidenceService;

    public AdminEvidencesController(IAdminEvidenceService adminEvidenceService)
    {
        _adminEvidenceService = adminEvidenceService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? challengeId)
    {
        try
        {
            var result = await _adminEvidenceService.GetAsync(GetUserId(), challengeId);
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminEvidenceRequest request)
    {
        try
        {
            var id = await _adminEvidenceService.CreateAsync(GetUserId(), request);
            return Ok(new { evidenceId = id, message = "Evidence oluşturuldu" });
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminEvidenceRequest request)
    {
        try
        {
            await _adminEvidenceService.UpdateAsync(GetUserId(), id, request);
            return Ok(new { message = "Evidence güncellendi" });
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _adminEvidenceService.DeleteAsync(GetUserId(), id);
            return Ok(new { message = "Evidence silindi" });
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