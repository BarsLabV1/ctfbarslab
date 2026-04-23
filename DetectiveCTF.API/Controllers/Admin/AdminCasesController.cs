using System.Security.Claims;
using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers.Admin;

[ApiController]
[Route("api/admin/cases")]
[Authorize]
public class AdminCasesController : ControllerBase
{
    private readonly IAdminCaseService _adminCaseService;

    public AdminCasesController(IAdminCaseService adminCaseService)
    {
        _adminCaseService = adminCaseService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> GetCases()
    {
        try
        {
            var result = await _adminCaseService.GetCasesAsync(GetUserId());
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AdminCaseRequest request)
    {
        try
        {
            var id = await _adminCaseService.CreateAsync(GetUserId(), request);
            return Ok(new { caseId = id, message = "Vaka oluşturuldu" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] AdminCaseRequest request)
    {
        try
        {
            await _adminCaseService.UpdateAsync(GetUserId(), id, request);
            return Ok(new { message = "Vaka güncellendi" });
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
            await _adminCaseService.DeleteAsync(GetUserId(), id);
            return Ok(new { message = "Vaka silindi" });
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