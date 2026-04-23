using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminUserService : IAdminUserService
{
    private readonly AppDbContext _context;

    public AdminUserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AdminUserListDto>> GetUsersAsync(int userId)
    {
        await EnsureAdminAsync(userId);

        return await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new AdminUserListDto(
                u.Id,
                u.Username,
                u.Email,
                u.TotalScore,
                u.IsAdmin,
                u.CreatedAt
            ))
            .ToListAsync();
    }

    public async Task DeleteUserAsync(int adminUserId, int targetUserId)
    {
        await EnsureAdminAsync(adminUserId);

        if (adminUserId == targetUserId)
            throw new InvalidOperationException("Kendinizi silemezsiniz");

        var user = await _context.Users.FindAsync(targetUserId);
        if (user == null)
            throw new KeyNotFoundException("Kullanıcı bulunamadı");

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
    }

    public async Task SetAdminAsync(int adminUserId, int targetUserId, bool isAdmin)
    {
        await EnsureAdminAsync(adminUserId);

        var user = await _context.Users.FindAsync(targetUserId);
        if (user == null)
            throw new KeyNotFoundException("Kullanıcı bulunamadı");

        user.IsAdmin = isAdmin;
        await _context.SaveChangesAsync();
    }

    private async Task EnsureAdminAsync(int userId)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");
    }
}