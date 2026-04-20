using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.DTOs;
using DetectiveCTF.API.Models;
using DetectiveCTF.API.Services;
using BCrypt.Net;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContextNew _context;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContextNew context, JwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Username == request.Username))
        {
            return BadRequest(new { message = "Kullanıcı adı zaten kullanılıyor" });
        }

        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { message = "Email zaten kullanılıyor" });
        }

        var user = new User
        {
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            TotalScore = 0
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user.Id, user.Username);

        return Ok(new AuthResponse(user.Id, user.Username, user.Email, user.TotalScore, user.IsAdmin, token));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return BadRequest(new { message = "Kullanıcı adı veya şifre hatalı" });
        }

        var token = _jwtService.GenerateToken(user.Id, user.Username);

        return Ok(new AuthResponse(user.Id, user.Username, user.Email, user.TotalScore, user.IsAdmin, token));
    }
}
