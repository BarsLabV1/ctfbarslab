using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services;

public class BoardCardService : IBoardCardService
{
    private readonly AppDbContext _context;

    public BoardCardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<BoardCardDto>> GetCardsAsync(int caseId, int userId)
    {
        var solvedIds = await _context.UserChallengeProgresses
            .Where(p => p.UserId == userId && p.IsSolved)
            .Select(p => p.ChallengeId)
            .ToListAsync();

        var teamMembership = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.UserId == userId);

        if (teamMembership != null)
        {
            var teamSolved = await _context.TeamMembers
                .Where(m => m.TeamId == teamMembership.TeamId)
                .SelectMany(m => _context.UserChallengeProgresses
                    .Where(p => p.UserId == m.UserId && p.IsSolved)
                    .Select(p => p.ChallengeId))
                .ToListAsync();

            solvedIds = solvedIds.Union(teamSolved).Distinct().ToList();
        }

        return await _context.BoardCards
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Id)
            .Select(c => new BoardCardDto(
                c.Id,
                c.CaseId,
                c.Type,
                c.Title,
                c.Content,
                c.FileUrl,
                c.ExternalUrl,
                c.DockerImage,
                c.PosX,
                c.PosY,
                c.Rotation,
                c.Color,
                c.UnlockedByChallenge,
                c.UnlockedByChallenge == null || solvedIds.Contains(c.UnlockedByChallenge.Value)
            ))
            .ToListAsync();
    }

    public async Task<List<BoardCardDto>> GetAdminCardsAsync(int caseId, int userId)
    {
        await EnsureAdminAsync(userId);

        return await _context.BoardCards
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Id)
            .Select(c => new BoardCardDto(
                c.Id,
                c.CaseId,
                c.Type,
                c.Title,
                c.Content,
                c.FileUrl,
                c.ExternalUrl,
                c.DockerImage,
                c.PosX,
                c.PosY,
                c.Rotation,
                c.Color,
                c.UnlockedByChallenge,
                true
            ))
            .ToListAsync();
    }

    public async Task<int> CreateAsync(int userId, BoardCardRequest request)
    {
        await EnsureAdminAsync(userId);

        var card = new BoardCard
        {
            CaseId = request.CaseId,
            Type = request.Type,
            Title = request.Title,
            Content = request.Content,
            FileUrl = request.FileUrl,
            ExternalUrl = request.ExternalUrl,
            DockerImage = request.DockerImage,
            PosX = request.PosX,
            PosY = request.PosY,
            Rotation = request.Rotation,
            Color = request.Color,
            UnlockedByChallenge = request.UnlockedByChallenge
        };

        _context.BoardCards.Add(card);
        await _context.SaveChangesAsync();
        return card.Id;
    }

    public async Task UpdateAsync(int userId, int id, BoardCardRequest request)
    {
        await EnsureAdminAsync(userId);

        var card = await _context.BoardCards.FindAsync(id);
        if (card == null)
            throw new KeyNotFoundException("Kart bulunamadı");

        card.Type = request.Type;
        card.Title = request.Title;
        card.Content = request.Content;
        card.FileUrl = request.FileUrl;
        card.ExternalUrl = request.ExternalUrl;
        card.DockerImage = request.DockerImage;
        card.PosX = request.PosX;
        card.PosY = request.PosY;
        card.Rotation = request.Rotation;
        card.Color = request.Color;
        card.UnlockedByChallenge = request.UnlockedByChallenge;

        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int userId, int id)
    {
        await EnsureAdminAsync(userId);

        var card = await _context.BoardCards.FindAsync(id);
        if (card == null)
            throw new KeyNotFoundException("Kart bulunamadı");

        _context.BoardCards.Remove(card);
        await _context.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");
    }
}