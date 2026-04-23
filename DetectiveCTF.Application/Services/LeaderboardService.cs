using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services;

public class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext _context;

    public LeaderboardService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync()
    {
        return await _context.Users
            .OrderByDescending(u => u.TotalScore)
            .Take(10)
            .Select(u => new LeaderboardEntryDto(
                u.Username,
                u.TotalScore,
                u.ChallengeProgresses.Count(cp => cp.IsSolved)
            ))
            .ToListAsync();
    }
}