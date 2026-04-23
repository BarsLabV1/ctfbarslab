namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminStatsDto(
    int TotalUsers,
    int TotalTeams,
    int TotalCases,
    int TotalChallenges,
    int TotalSolvedChallenges,
    int ActiveSessions
);