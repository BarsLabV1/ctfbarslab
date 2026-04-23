namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminEvidenceRequest(
    int ChallengeId,
    string Title,
    string Type,
    string FileUrl,
    string? Description,
    string? Metadata,
    int Order
);

public record AdminEvidenceListDto(
    int Id,
    int ChallengeId,
    string ChallengeName,
    int CaseId,
    string CaseName,
    string Title,
    string Type,
    string FileUrl,
    string? Description,
    int Order
);