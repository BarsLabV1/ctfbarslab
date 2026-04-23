using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminEvidenceService : IAdminEvidenceService
{
    private readonly AppDbContext _context;

    public AdminEvidenceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminEvidenceListDto>> GetAsync(int userId, int? challengeId = null)
    {
        await EnsureAdminAsync(userId);

        var query = _context.Evidences
            .Include(e => e.Challenge)
            .ThenInclude(c => c.Case)
            .AsQueryable();

        if (challengeId.HasValue)
            query = query.Where(e => e.ChallengeId == challengeId.Value);

        return await query
            .OrderBy(e => e.Order)
            .Select(e => new AdminEvidenceListDto(
                e.Id,
                e.ChallengeId,
                e.Challenge.Title,
                e.Challenge.CaseId,
                e.Challenge.Case.Title,
                e.Title,
                e.Type,
                e.FileUrl,
                e.Description,
                e.Order
            ))
            .ToListAsync();
    }

    public async Task<int> CreateAsync(int userId, AdminEvidenceRequest request)
    {
        await EnsureAdminAsync(userId);

        var exists = await _context.Challenges.AnyAsync(c => c.Id == request.ChallengeId);
        if (!exists)
            throw new KeyNotFoundException("Challenge bulunamadı");

        var evidence = new Evidence
        {
            ChallengeId = request.ChallengeId,
            Title = request.Title,
            Type = request.Type,
            FileUrl = request.FileUrl,
            Description = request.Description,
            Metadata = request.Metadata,
            Order = request.Order
        };

        _context.Evidences.Add(evidence);
        await _context.SaveChangesAsync();
        return evidence.Id;
    }

    public async Task UpdateAsync(int userId, int id, AdminEvidenceRequest request)
    {
        await EnsureAdminAsync(userId);

        var evidence = await _context.Evidences.FindAsync(id);
        if (evidence == null)
            throw new KeyNotFoundException("Evidence bulunamadı");

        evidence.ChallengeId = request.ChallengeId;
        evidence.Title = request.Title;
        evidence.Type = request.Type;
        evidence.FileUrl = request.FileUrl;
        evidence.Description = request.Description;
        evidence.Metadata = request.Metadata;
        evidence.Order = request.Order;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int id)
    {
        await EnsureAdminAsync(userId);

        var evidence = await _context.Evidences.FindAsync(id);
        if (evidence == null)
            throw new KeyNotFoundException("Evidence bulunamadı");

        _context.Evidences.Remove(evidence);
        await _context.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");
    }
}