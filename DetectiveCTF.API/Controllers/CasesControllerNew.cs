using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

// Bu controller devre dışı bırakıldı — CasesController kullanılıyor
// [ApiController]
// [Route("api/cases")]
[Authorize]
public class CasesControllerNew : ControllerBase
{
    private readonly AppDbContextNew _context;

    public CasesControllerNew(AppDbContextNew context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<ActionResult> GetCases()
    {
        var userId = GetUserId();
        
        var cases = await _context.Cases
            .Where(c => c.IsActive)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.Description,
                c.Difficulty,
                c.TotalPoints,
                c.ImageUrl,
                ChallengeCount = c.Challenges.Count,
                IsCompleted = false // TODO: Calculate based on user progress
            })
            .ToListAsync();

        return Ok(cases);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetCase(int id)
    {
        var caseEntity = await _context.Cases
            .Include(c => c.Challenges)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (caseEntity == null)
        {
            return NotFound(new { message = "Vaka bulunamadı" });
        }

        return Ok(new
        {
            caseEntity.Id,
            caseEntity.Title,
            caseEntity.Description,
            caseEntity.Story,
            caseEntity.Difficulty,
            caseEntity.TotalPoints,
            caseEntity.ImageUrl,
            ChallengeCount = caseEntity.Challenges.Count
        });
    }
}
