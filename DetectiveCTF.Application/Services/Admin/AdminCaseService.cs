using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminCaseService : IAdminCaseService
{
    private readonly AppDbContext _context;

    public AdminCaseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminCaseListDto>> GetCasesAsync(int userId)
    {
        await EnsureAdminAsync(userId);

        return await _context.Cases
     .Include(c => c.Challenges)
     .OrderBy(c => c.Id)
     .Select(c => new AdminCaseListDto(
         c.Id,
         c.Title,
         c.Description,
         c.Story,
         c.Difficulty,
         c.TotalPoints,
         c.ImageUrl,
         c.IsActive,
         c.Challenges.Count
     ))
     .ToListAsync();
    }

    public async Task<int> CreateAsync(int userId, AdminCaseRequest request)
    {
        await EnsureAdminAsync(userId);

        var caseEntity = new Case
        {
            Title = request.Title,
            Description = request.Description,
            Story = request.Story,
            Difficulty = request.Difficulty,
            TotalPoints = request.TotalPoints,
            ImageUrl = request.ImageUrl,
            IsActive = true
        };

        _context.Cases.Add(caseEntity);
        await _context.SaveChangesAsync();
        return caseEntity.Id;
    }

    public async Task UpdateAsync(int userId, int id, AdminCaseRequest request)
    {
        await EnsureAdminAsync(userId);

        var caseEntity = await _context.Cases.FindAsync(id);
        if (caseEntity == null)
            throw new KeyNotFoundException("Vaka bulunamadı");

        caseEntity.Title = request.Title;
        caseEntity.Description = request.Description;
        caseEntity.Story = request.Story;
        caseEntity.Difficulty = request.Difficulty;
        caseEntity.TotalPoints = request.TotalPoints;
        caseEntity.ImageUrl = request.ImageUrl;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int id)
    {
        await EnsureAdminAsync(userId);

        var caseEntity = await _context.Cases.FindAsync(id);
        if (caseEntity == null)
            throw new KeyNotFoundException("Vaka bulunamadı");

        _context.Cases.Remove(caseEntity);
        await _context.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");
    }
}