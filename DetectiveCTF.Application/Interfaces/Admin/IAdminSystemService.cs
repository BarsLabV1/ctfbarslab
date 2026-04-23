namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminSystemService
{
    Task<bool> CheckAdminAsync(int userId);
    Task<string> ResetUsersAsync(int userId);
}