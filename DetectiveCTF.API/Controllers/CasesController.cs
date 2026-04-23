using System.Security.Claims;
using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/cases")]
[Authorize]
public class CasesController : ControllerBase
{
    private readonly ICaseService _caseService;

    public CasesController(ICaseService caseService)
    {
        _caseService = caseService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> GetCases()
    {
        var userId = GetUserId();
        var result = await _caseService.GetCasesAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCase(int id)
    {
        var result = await _caseService.GetCaseByIdAsync(id);

        if (result == null)
            return NotFound(new { message = "Vaka bulunamadı" });

        return Ok(result);
    }
}