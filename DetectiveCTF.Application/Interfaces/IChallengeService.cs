using DetectiveCTF.Application.DTOs;

namespace DetectiveCTF.Application.Interfaces;

public interface IChallengeService
{
    Task<List<ChallengeListItemDto>> GetChallengesByCaseAsync(int caseId, int userId);
    Task<ChallengeDetailDto?> GetChallengeByIdAsync(int challengeId, int userId);
    Task<SubmitFlagResponse> SubmitFlagAsync(int challengeId, int userId, SubmitFlagRequest request);
    Task<UseHintResponse> UseHintAsync(int challengeId, int userId, UseHintRequest request);
    Task<StartVmResponse> StartVmAsync(int challengeId, int userId);
    Task<StartVmResponse> StartKaliAsync(int challengeId, int userId);
    Task<string> StopVmAsync(int challengeId, int userId);
}