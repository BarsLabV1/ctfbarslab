using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.Models;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TeamsController : ControllerBase
{
    private readonly AppDbContextNew _context;

    public TeamsController(AppDbContextNew context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    private async Task<string> GenerateInviteCodeAsync()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        string code;
        
        do
        {
            code = new string(Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
        while (await _context.Teams.AnyAsync(t => t.InviteCode == code));
        
        return code;
    }

    [HttpPost("create")]
    public async Task<ActionResult> CreateTeam([FromBody] CreateTeamRequest request)
    {
        try
        {
            var userId = GetUserId();
            
            if (userId == 0)
                return Unauthorized(new { message = "Geçersiz oturum, tekrar giriş yapın" });

            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new { message = "Takım adı boş olamaz" });

            if (string.IsNullOrWhiteSpace(request.LeaderRole))
                return BadRequest(new { message = "Rol seçmelisiniz" });

            // Kullanıcı zaten bir takımda mı?
            var existingMembership = await _context.TeamMembers
                .AnyAsync(tm => tm.UserId == userId);

            if (existingMembership)
                return BadRequest(new { message = "Zaten bir takımdasınız" });

            // Kullanıcı var mı?
            var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
            if (!userExists)
                return BadRequest(new { message = "Kullanıcı bulunamadı, tekrar giriş yapın" });

            var team = new Team
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                LeaderId = userId,
                MaxMembers = 4,
                InviteCode = await GenerateInviteCodeAsync()
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            var leaderMember = new TeamMember
            {
                TeamId = team.Id,
                UserId = userId,
                Role = request.LeaderRole
            };

            _context.TeamMembers.Add(leaderMember);
            await _context.SaveChangesAsync();

            return Ok(new { teamId = team.Id, inviteCode = team.InviteCode, message = "Takım oluşturuldu" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Sunucu hatası: {ex.Message}" });
        }
    }

    [HttpPost("join-by-code")]
    public async Task<ActionResult> JoinTeamByCode([FromBody] JoinByCodeRequest request)
    {
        try
        {
            var userId = GetUserId();

            var existingMembership = await _context.TeamMembers
                .AnyAsync(tm => tm.UserId == userId);

            if (existingMembership)
                return BadRequest(new { message = "Zaten bir takımdasınız" });

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.InviteCode == request.InviteCode.ToUpper().Trim());

            if (team == null)
                return NotFound(new { message = "Geçersiz davet kodu" });

            if (team.Members.Count >= team.MaxMembers)
                return BadRequest(new { message = "Takım dolu (maksimum 4 kişi)" });

            var member = new TeamMember
            {
                TeamId = team.Id,
                UserId = userId,
                Role = request.Role
            };

            _context.TeamMembers.Add(member);
            await _context.SaveChangesAsync();

            return Ok(new { teamId = team.Id, teamName = team.Name, message = "Takıma katıldınız" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Sunucu hatası: {ex.Message}" });
        }
    }

    [HttpPost("{teamId}/join")]
    public async Task<ActionResult> JoinTeam(int teamId, [FromBody] JoinTeamRequest request)
    {
        var userId = GetUserId();
        
        var team = await _context.Teams
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            return NotFound(new { message = "Takım bulunamadı" });
        }

        if (team.Members.Count >= team.MaxMembers)
        {
            return BadRequest(new { message = "Takım dolu" });
        }

        if (team.Members.Any(m => m.UserId == userId))
        {
            return BadRequest(new { message = "Zaten bu takımdasınız" });
        }

        var member = new TeamMember
        {
            TeamId = teamId,
            UserId = userId,
            Role = request.Role
        };

        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Takıma katıldınız" });
    }

    [HttpGet]
    public async Task<ActionResult> GetTeams()
    {
        var teams = await _context.Teams
            .Include(t => t.Leader)
            .Include(t => t.Members)
            .ThenInclude(m => m.User)
            .Where(t => t.IsActive)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                t.TotalScore,
                LeaderName = t.Leader.Username,
                MemberCount = t.Members.Count,
                MaxMembers = t.MaxMembers,
                Members = t.Members.Select(m => new
                {
                    m.User.Username,
                    m.Role
                }).ToList()
            })
            .ToListAsync();

        return Ok(teams);
    }

    [HttpDelete("{teamId}/kick/{userId}")]
    public async Task<ActionResult> KickMember(int teamId, int userId)
    {
        var requesterId = GetUserId();

        var team = await _context.Teams.FindAsync(teamId);
        if (team == null)
            return NotFound(new { message = "Takım bulunamadı" });

        if (team.LeaderId != requesterId)
            return Forbid();

        if (userId == requesterId)
            return BadRequest(new { message = "Kendinizi atamazsınız" });

        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

        if (member == null)
            return NotFound(new { message = "Üye bulunamadı" });

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Üye atıldı" });
    }

    [HttpGet("my-team")]
    public async Task<ActionResult> GetMyTeam()
    {
        var userId = GetUserId();
        
        var membership = await _context.TeamMembers
            .Include(tm => tm.Team)
            .ThenInclude(t => t.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(tm => tm.UserId == userId);

        if (membership == null)
        {
            return Ok(new { hasTeam = false });
        }

        var team = membership.Team;
        
        return Ok(new
        {
            hasTeam = true,
            teamId = team.Id,
            teamName = team.Name,
            description = team.Description,
            totalScore = team.TotalScore,
            isLeader = team.LeaderId == userId,
            inviteCode = team.InviteCode,
            myRole = membership.Role,
            members = team.Members.Select(m => new
            {
                userId = m.UserId,
                username = m.User.Username,
                role = m.Role,
                isLeader = m.UserId == team.LeaderId
            }).ToList()
        });
    }
}

public record CreateTeamRequest(string Name, string? Description, string LeaderRole);
public record JoinTeamRequest(string Role);
public record JoinByCodeRequest(string InviteCode, string Role);
