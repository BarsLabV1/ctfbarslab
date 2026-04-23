using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using DetectiveCTF.Infrastructure.Services;

namespace DetectiveCTF.Application.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwtService;

    public AuthService(AppDbContext context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            throw new Exception("Kullanıcı adı zaten kullanılıyor");

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            throw new Exception("Email zaten kullanılıyor");

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            TotalScore = 0,
            IsAdmin = false
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id, user.Username/*, user.IsAdmin*/);

        return new AuthResponse(
            user.Id,
            user.Username,
            user.Email,
            user.TotalScore,
            user.IsAdmin,
            token
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            throw new Exception("Kullanıcı adı veya şifre hatalı");

        var token = _jwtService.GenerateToken(user.Id, user.Username /*,user.IsAdmin*/);

        return new AuthResponse(
            user.Id,
            user.Username,
            user.Email,
            user.TotalScore,
            user.IsAdmin,
            token
        );
    }
}