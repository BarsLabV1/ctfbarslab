namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminCaseRequest(
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int TotalPoints,
    string? ImageUrl,
    bool HasVM = false,
    string? DockerImage = null,
    string? Domain = null
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
    int ChallengeCount,
    bool HasVM = false,
    string? DockerImage = null,
    string? Domain = null
);