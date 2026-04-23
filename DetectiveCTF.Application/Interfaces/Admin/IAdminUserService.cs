using DetectiveCTF.Application.DTOs.Admin;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminUserService
{
    Task<List<AdminUserListDto>> GetUsersAsync(int userId);
    Task DeleteUserAsync(int adminUserId, int targetUserId);
    Task SetAdminAsync(int adminUserId, int targetUserId, bool isAdmin);
}