using DetectiveCTF.Application.DTOs.Admin;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminEvidenceService
{
    Task<List<AdminEvidenceListDto>> GetAsync(int userId, int? challengeId = null);
    Task<int> CreateAsync(int userId, AdminEvidenceRequest request);
    Task UpdateAsync(int userId, int id, AdminEvidenceRequest request);
    Task DeleteAsync(int userId, int id);
}