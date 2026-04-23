namespace DetectiveCTF.Application.DTOs.Admin;

public record AdminUserListDto(
    int Id,
    string Username,
    string Email,
    int TotalScore,
    bool IsAdmin,
    DateTime CreatedAt
);