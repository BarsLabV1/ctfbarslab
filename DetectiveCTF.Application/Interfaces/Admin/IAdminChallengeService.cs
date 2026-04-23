using DetectiveCTF.Application.DTOs.Admin;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminChallengeService
{
    Task<List<AdminChallengeListDto>> GetChallengesAsync(int adminUserId, int? caseId = null);
    Task<int> CreateAsync(int adminUserId, AdminChallengeRequest request);
    Task UpdateAsync(int adminUserId, int id, AdminChallengeRequest request);
    Task DeleteAsync(int adminUserId, int id);
}