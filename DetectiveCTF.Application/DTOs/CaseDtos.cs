namespace DetectiveCTF.Application.DTOs;

public record CaseListDto(
    int Id,
    string Title,
    string Description,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    int ChallengeCount,
    bool IsCompleted,
    bool HasVM = false
);

public record CaseDetailDto(
    int Id,
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    int ChallengeCount,
    bool HasVM = false,
    string? Domain = null
);