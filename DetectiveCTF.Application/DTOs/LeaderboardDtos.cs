namespace DetectiveCTF.Application.DTOs;

public record LeaderboardEntryDto(
    string Username,
    int TotalScore,
    int SolvedChallenges
);