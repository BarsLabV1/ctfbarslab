namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminChallengeRequest(
    int CaseId,
    string Title,
    string Description,
    string Category,
    int Order,
    int Points,
    string Flag,
    int? RequiredChallengeId,
    bool HasVM,
    string? DockerImage,
    string? VMConnectionInfo,
    string? Files,
    string? Hints,
    string? UnlockContent
);

public record AdminChallengeListDto(
    int Id,
    int CaseId,
    string CaseTitle,
    string Title,
    string Description,
    string Category,
    int Order,
    int Points,
    string Flag,
    bool HasVM,
    string? DockerImage,
    string? VMConnectionInfo,
    string? Files,
    string? Hints,
    string? UnlockContent,
    int? RequiredChallengeId
);