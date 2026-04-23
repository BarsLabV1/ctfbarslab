using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services;

public class TeamService : ITeamService
{
    private readonly AppDbContext _context;

    public TeamService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TeamActionResponse> CreateTeamAsync(int userId, CreateTeamRequest request)
    {
        if (userId == 0)
            throw new UnauthorizedAccessException("Geçersiz oturum, tekrar giriş yapın");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Takım adı boş olamaz");

        if (string.IsNullOrWhiteSpace(request.LeaderRole))
            throw new InvalidOperationException("Rol seçmelisiniz");

        var existingMembership = await _context.TeamMembers.AnyAsync(tm => tm.UserId == userId);
        if (existingMembership)
            throw new InvalidOperationException("Zaten bir takımdasınız");

        var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
            throw new InvalidOperationException("Kullanıcı bulunamadı, tekrar giriş yapın");

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

        return new TeamActionResponse("Takım oluşturuldu", team.Id, null, team.InviteCode);
    }

    public async Task<TeamActionResponse> JoinTeamByCodeAsync(int userId, JoinByCodeRequest request)
    {
        var existingMembership = await _context.TeamMembers.AnyAsync(tm => tm.UserId == userId);
        if (existingMembership)
            throw new InvalidOperationException("Zaten bir takımdasınız");

        var team = await _context.Teams
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.InviteCode == request.InviteCode.ToUpper().Trim());

        if (team == null)
            throw new KeyNotFoundException("Geçersiz davet kodu");

        if (team.Members.Count >= team.MaxMembers)
            throw new InvalidOperationException("Takım dolu (maksimum 4 kişi)");

        var member = new TeamMember
        {
            TeamId = team.Id,
            UserId = userId,
            Role = request.Role
        };

        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync();

        return new TeamActionResponse("Takıma katıldınız", team.Id, team.Name);
    }

    public async Task<TeamActionResponse> JoinTeamAsync(int userId, int teamId, JoinTeamRequest request)
    {
        var existingMembership = await _context.TeamMembers.AnyAsync(tm => tm.UserId == userId);
        if (existingMembership)
            throw new InvalidOperationException("Zaten bir takımdasınız");

        var team = await _context.Teams
            .Include(t => t.Members)
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
            throw new KeyNotFoundException("Takım bulunamadı");

        if (team.Members.Count >= team.MaxMembers)
            throw new InvalidOperationException("Takım dolu");

        if (team.Members.Any(m => m.UserId == userId))
            throw new InvalidOperationException("Zaten bu takımdasınız");

        var member = new TeamMember
        {
            TeamId = teamId,
            UserId = userId,
            Role = request.Role
        };

        _context.TeamMembers.Add(member);
        await _context.SaveChangesAsync();

        return new TeamActionResponse("Takıma katıldınız", team.Id, team.Name);
    }

    public async Task<List<TeamListDto>> GetTeamsAsync()
    {
        return await _context.Teams
            .Include(t => t.Leader)
            .Include(t => t.Members)
            .ThenInclude(m => m.User)
            .Where(t => t.IsActive)
            .Select(t => new TeamListDto(
                t.Id,
                t.Name,
                t.Description,
                t.TotalScore,
                t.Leader.Username,
                t.Members.Count,
                t.MaxMembers,
                t.Members.Select(m => new TeamListMemberDto(
                    m.User.Username,
                    m.Role
                )).ToList()
            ))
            .ToListAsync();
    }

    public async Task<TeamActionResponse> KickMemberAsync(int requesterId, int teamId, int userId)
    {
        var team = await _context.Teams.FindAsync(teamId);
        if (team == null)
            throw new KeyNotFoundException("Takım bulunamadı");

        if (team.LeaderId != requesterId)
            throw new UnauthorizedAccessException("Bu işlem için yetkiniz yok");

        if (userId == requesterId)
            throw new InvalidOperationException("Kendinizi atamazsınız");

        var member = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.TeamId == teamId && m.UserId == userId);

        if (member == null)
            throw new KeyNotFoundException("Üye bulunamadı");

        _context.TeamMembers.Remove(member);
        await _context.SaveChangesAsync();

        return new TeamActionResponse("Üye atıldı");
    }

    public async Task<MyTeamDto> GetMyTeamAsync(int userId)
    {
        var membership = await _context.TeamMembers
            .Include(tm => tm.Team)
            .ThenInclude(t => t.Members)
            .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(tm => tm.UserId == userId);

        if (membership == null)
        {
            return new MyTeamDto(false, null, null, null, 0, false, null, null, null);
        }

        var team = membership.Team;

        return new MyTeamDto(
            true,
            team.Id,
            team.Name,
            team.Description,
            team.TotalScore,
            team.LeaderId == userId,
            team.InviteCode,
            membership.Role,
            team.Members.Select(m => new TeamMemberDto(
                m.UserId,
                m.User.Username,
                m.Role,
                m.UserId == team.LeaderId
            )).ToList()
        );
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
}