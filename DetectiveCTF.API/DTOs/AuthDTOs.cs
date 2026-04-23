namespace DetectiveCTF.API.DTOs;

public record RegisterRequest(string Username, string Email, string Password);

public record LoginRequest(string Username, string Password);

public record AuthResponse(int UserId, string Username, string Email, int TotalScore, bool IsAdmin, string Token);
