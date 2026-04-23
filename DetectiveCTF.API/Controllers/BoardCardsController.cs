using System.Security.Claims;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/board-cards")]
[Authorize]
public class BoardCardsController : ControllerBase
{
    private readonly IBoardCardService _boardCardService;

    public BoardCardsController(IBoardCardService boardCardService)
    {
        _boardCardService = boardCardService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("case/{caseId}")]
    public async Task<IActionResult> GetCards(int caseId)
    {
        var result = await _boardCardService.GetCardsAsync(caseId, GetUserId());
        return Ok(result);
    }

    [HttpGet("admin/case/{caseId}")]
    public async Task<IActionResult> AdminGetCards(int caseId)
    {
        try
        {
            var result = await _boardCardService.GetAdminCardsAsync(caseId, GetUserId());
            return Ok(result);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] BoardCardRequest request)
    {
        try
        {
            var id = await _boardCardService.CreateAsync(GetUserId(), request);
            return Ok(new { id, message = "Kart eklendi" });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] BoardCardRequest request)
    {
        try
        {
            await _boardCardService.UpdateAsync(GetUserId(), id, request);
            return Ok(new { message = "Kart güncellendi" });
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
            await _boardCardService.DeleteAsync(GetUserId(), id);
            return Ok(new { message = "Kart silindi" });
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