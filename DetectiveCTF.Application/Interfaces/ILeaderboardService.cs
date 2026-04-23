using DetectiveCTF.Application.DTOs;

namespace DetectiveCTF.Application.Interfaces;

public interface ILeaderboardService
{
    Task<List<LeaderboardEntryDto>> GetLeaderboardAsync();
}