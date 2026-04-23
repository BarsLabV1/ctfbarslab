using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services;

public class CaseService : ICaseService
{
    private readonly AppDbContext _context;

    public CaseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CaseListDto>> GetCasesAsync(int userId)
    {
        var cases = await _context.Cases
            .Where(c => c.IsActive)
            .Select(c => new CaseListDto(
                c.Id,
                c.Title,
                c.Description,
                c.Difficulty,
                c.TotalPoints,
                c.ImageUrl,
                c.Challenges.Count,
                _context.UserCaseProgresses.Any(p => p.UserId == userId && p.CaseId == c.Id && p.IsCompleted)
            ))
            .ToListAsync();

        return cases;
    }

    public async Task<CaseDetailDto?> GetCaseByIdAsync(int caseId)
    {
        var caseEntity = await _context.Cases
            .Include(c => c.Challenges)
            .FirstOrDefaultAsync(c => c.Id == caseId);

        if (caseEntity == null)
            return null;

        return new CaseDetailDto(
            caseEntity.Id,
            caseEntity.Title,
            caseEntity.Description,
            caseEntity.Story,
            caseEntity.Difficulty,
            caseEntity.TotalPoints,
            caseEntity.ImageUrl,
            caseEntity.Challenges.Count
        );
    }
}