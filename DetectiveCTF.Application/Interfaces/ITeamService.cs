using DetectiveCTF.Application.DTOs;

namespace DetectiveCTF.Application.Interfaces;

public interface ITeamService
{
    Task<TeamActionResponse> CreateTeamAsync(int userId, CreateTeamRequest request);
    Task<TeamActionResponse> JoinTeamByCodeAsync(int userId, JoinByCodeRequest request);
    Task<TeamActionResponse> JoinTeamAsync(int userId, int teamId, JoinTeamRequest request);
    Task<List<TeamListDto>> GetTeamsAsync();
    Task<TeamActionResponse> KickMemberAsync(int requesterId, int teamId, int userId);
    Task<MyTeamDto> GetMyTeamAsync(int userId);
}