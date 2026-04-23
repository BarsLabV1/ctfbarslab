using DetectiveCTF.Application.DTOs.Admin;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminStatsService
{
    Task<AdminStatsDto> GetStatsAsync(int userId);
}