namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminCaseRequest(
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl
);

public record AdminCaseListDto(
    int Id,
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    bool IsActive,
    int ChallengeCount
);