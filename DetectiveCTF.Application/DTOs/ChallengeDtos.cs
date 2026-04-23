namespace DetectiveCTF.Application.DTOs;

public record ChallengeListItemDto(
    int Id,
    string Title,
    string Description,
    string Category,
    int Order,
    int Points,
    bool HasVM,
    string? Hints,
    string? UnlockContent,
    int? RequiredChallengeId,
    bool IsUnlocked,
    bool IsSolved,
    int Attempts,
    string? RequiredChallengeTitle
);

public record EvidenceDto(
    int Id,
    string Title,
    string Type,
    string FileUrl,
    string? Description,
    string? Metadata
);

public record ChallengeDetailDto(
    int Id,
    string Title,
    string Description,
    string Category,
    int Points,
    bool HasVM,
    string? Files,
    string? Hints,
    List<EvidenceDto> Evidences,
    bool IsSolved,
    int Attempts,
    string? UsedHints,
    string? VMConnectionInfo
);

public record SubmitFlagRequest(string Flag);
public record SubmitFlagResponse(bool Success, string Message, int? Points = null, string? UnlockContent = null, int? Attempts = null);

public record UseHintRequest(int HintIndex);
public record UseHintResponse(string Text, bool AlreadyUsed, int Penalty, int? PenaltyPercent = null);

public record StartVmResponse(
    string Message,
    int? VmId,
    string? IpAddress,
    int? Port,
    int? TerminalPort,
    int? KaliPort,
    string? WebUrl,
    DateTime? ExpiresAt
);

public record HintItem(string Text, int PenaltyPercent);