namespace DetectiveCTF.Application.DTOs;

public record BoardCardDto(
    int Id,
    int CaseId,
    string Type,
    string Title,
    string? Content,
    string? FileUrl,
    string? ExternalUrl,
    string? DockerImage,
    int PosX,
    int PosY,
    float Rotation,
    string? Color,
    int? UnlockedByChallenge,
    bool IsUnlocked
);

public record BoardCardRequest(
    int CaseId,
    string Type,
    string Title,
    string? Content,
    string? FileUrl,
    string? ExternalUrl,
    string? DockerImage,
    int PosX,
    int PosY,
    float Rotation,
    string? Color,
    int? UnlockedByChallenge
);