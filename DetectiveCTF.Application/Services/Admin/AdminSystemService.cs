using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminSystemService : IAdminSystemService
{
    private readonly AppDbContext _context;

    public AdminSystemService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CheckAdminAsync(int userId)
    {
        return await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
    }

    public async Task<string> ResetUsersAsync(int userId)
    {
        var isAdmin = await CheckAdminAsync(userId);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");

        var nonAdminCount = await _context.Users.CountAsync(u => !u.IsAdmin);

        _context.TeamMembers.RemoveRange(_context.TeamMembers);
        _context.Teams.RemoveRange(_context.Teams);
        _context.UserChallengeProgresses.RemoveRange(_context.UserChallengeProgresses);
        _context.UserCaseProgresses.RemoveRange(_context.UserCaseProgresses);
        _context.VMInstances.RemoveRange(_context.VMInstances);
        _context.BoardStates.RemoveRange(_context.BoardStates);
        _context.Users.RemoveRange(_context.Users.Where(u => !u.IsAdmin));

        await _context.SaveChangesAsync();

        return $"{nonAdminCount} kullanıcı ve tüm ilgili veriler silindi";
    }
}