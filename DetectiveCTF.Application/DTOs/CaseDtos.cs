namespace DetectiveCTF.Application.DTOs;

public record CaseListDto(
    int Id,
    string Title,
    string Description,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    int ChallengeCount,
    bool IsCompleted
);

public record CaseDetailDto(
    int Id,
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    int ChallengeCount
);