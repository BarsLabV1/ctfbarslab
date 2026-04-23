using DetectiveCTF.Application.DTOs.Admin;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminCaseService
{
    Task<List<AdminCaseListDto>> GetCasesAsync(int userId);
    Task<int> CreateAsync(int userId, AdminCaseRequest request);
    Task UpdateAsync(int userId, int id, AdminCaseRequest request);
    Task DeleteAsync(int userId, int id);
}