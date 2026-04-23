using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminChallengeService : IAdminChallengeService
{
    private readonly AppDbContext _context;

    public AdminChallengeService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminChallengeListDto>> GetChallengesAsync(int adminUserId, int? caseId = null)
    {
        await EnsureAdminAsync(adminUserId);

        var query = _context.Challenges
            .Include(c => c.Case)
            .AsQueryable();

        if (caseId.HasValue)
            query = query.Where(c => c.CaseId == caseId.Value);

        return await query
     .OrderBy(c => c.CaseId)
     .ThenBy(c => c.Order)
     .Select(c => new AdminChallengeListDto(
         c.Id,
         c.CaseId,
         c.Case.Title,
         c.Title,
         c.Description,
         c.Category,
         c.Order,
         c.Points,
         c.Flag,
         c.HasVM,
         c.DockerImage,
         c.VMConnectionInfo,
         c.Files,
         c.Hints,
         c.UnlockContent,
         c.RequiredChallengeId
     ))
     .ToListAsync();
    }

    public async Task<int> CreateAsync(int adminUserId, AdminChallengeRequest request)
    {
        await EnsureAdminAsync(adminUserId);

        var challenge = new Challenge
        {
            CaseId = request.CaseId,
            Title = request.Title,
            Description = request.Description,
            Category = request.Category,
            Order = request.Order,
            Points = request.Points,
            Flag = request.Flag,
            RequiredChallengeId = request.RequiredChallengeId,
            HasVM = request.HasVM,
            DockerImage = request.DockerImage,
            VMConnectionInfo = request.VMConnectionInfo,
            Files = request.Files,
            Hints = request.Hints,
            UnlockContent = request.UnlockContent
        };

        _context.Challenges.Add(challenge);
        await _context.SaveChangesAsync();

        return challenge.Id;
    }

    public async Task UpdateAsync(int adminUserId, int id, AdminChallengeRequest request)
    {
        await EnsureAdminAsync(adminUserId);

        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
            throw new KeyNotFoundException("Challenge bulunamadı");

        challenge.CaseId = request.CaseId;
        challenge.Title = request.Title;
        challenge.Description = request.Description;
        challenge.Category = request.Category;
        challenge.Order = request.Order;
        challenge.Points = request.Points;
        challenge.Flag = request.Flag;
        challenge.RequiredChallengeId = request.RequiredChallengeId;
        challenge.HasVM = request.HasVM;
        challenge.DockerImage = request.DockerImage;
        challenge.VMConnectionInfo = request.VMConnectionInfo;
        challenge.Files = request.Files;
        challenge.Hints = request.Hints;
        challenge.UnlockContent = request.UnlockContent;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int adminUserId, int id)
    {
        await EnsureAdminAsync(adminUserId);

        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
            throw new KeyNotFoundException("Challenge bulunamadı");

        _context.Challenges.Remove(challenge);
        await _context.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");
    }
}