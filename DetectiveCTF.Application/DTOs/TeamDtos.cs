namespace DetectiveCTF.Application.DTOs;

public record CreateTeamRequest(string Name, string? Description, string LeaderRole);
public record JoinTeamRequest(string Role);
public record JoinByCodeRequest(string InviteCode, string Role);

public record TeamMemberDto(
    int UserId,
    string Username,
    string Role,
    bool IsLeader
);

public record TeamListDto(
    int Id,
    string Name,
    string? Description,
    int TotalScore,
    string LeaderName,
    int MemberCount,
    int MaxMembers,
    List<TeamListMemberDto> Members
);

public record TeamListMemberDto(
    string Username,
    string Role
);

public record MyTeamDto(
    bool HasTeam,
    int? TeamId,
    string? TeamName,
    string? Description,
    int TotalScore,
    bool IsLeader,
    string? InviteCode,
    string? MyRole,
    List<TeamMemberDto>? Members,
    int? MyUserId = null,
    List<string>? TakenRoles = null
);

public record TeamActionResponse(
    string Message,
    int? TeamId = null,
    string? TeamName = null,
    string? InviteCode = null
);