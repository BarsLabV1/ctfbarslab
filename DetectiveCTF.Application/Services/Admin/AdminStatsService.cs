using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminStatsService : IAdminStatsService
{
    private readonly AppDbContext _context;

    public AdminStatsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AdminStatsDto> GetStatsAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");

        return new AdminStatsDto(
    await _context.Users.CountAsync(),
    await _context.Teams.CountAsync(),
    await _context.Cases.CountAsync(),
    await _context.Challenges.CountAsync(),
    await _context.UserChallengeProgresses.CountAsync(p => p.IsSolved),
    await _context.VMInstances.CountAsync(v => v.Status == "running")
        );
    }
}