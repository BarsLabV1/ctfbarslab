namespace DetectiveCTF.API.DTOs;

public record CaseListDto(
    int Id,
    string Title,
    string Description,
    int Difficulty,
    int Points,
    bool IsCompleted,
    int? UserScore
);

public record CaseDetailDto(
    int Id,
    string Title,
    string Description,
    string Story,
    int Difficulty,
    int Points,
    List<ClueDto> AvailableClues,
    List<HackableSystemDto> HackableSystems,
    bool IsCompleted,
    int? UserScore
);

public record ClueDto(
    int Id,
    string Title,
    string Content,
    int Order
);

public record HackableSystemDto(
    int Id,
    string Name,
    string Type,
    string Host,
    int Port,
    string Description,
    string? Hint,
    bool IsHacked
);

public record HackAttemptRequest(
    int SystemId,
    string Username,
    string Password
);

public record HackAttemptResponse(
    bool Success,
    string Message,
    object? RewardData,
    List<ClueDto>? NewClues
);

public record SolveCaseRequest(
    int CaseId,
    string Answer
);

public record SolveCaseResponse(
    bool Success,
    string Message,
    int? Score
);
