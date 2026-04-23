using System.Text.Json;
using DetectiveCTF.Application.DTOs;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Core.Entities;
using DetectiveCTF.Infrastructure.Persistence;
using DetectiveCTF.Infrastructure.Services;
using DetectiveCTF.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace DetectiveCTF.Application.Services;

public class ChallengeService : IChallengeService
{
    private readonly AppDbContext _context;
    private readonly DockerService _dockerService;
    private readonly IHubContext<BoardHub> _hubContext;
    private readonly ILogger<ChallengeService> _logger;

    public ChallengeService(
        AppDbContext context,
        DockerService dockerService,
        IHubContext<BoardHub> hubContext,
        ILogger<ChallengeService> logger)
    {
        _context = context;
        _dockerService = dockerService;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task<List<ChallengeListItemDto>> GetChallengesByCaseAsync(int caseId, int userId)
    {
        var teamMembership = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.UserId == userId);

        var challenges = await _context.Challenges
            .Include(c => c.RequiredChallenge)
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Order)
            .ToListAsync();

        var userProgresses = await _context.UserChallengeProgresses
            .Where(p => p.UserId == userId)
            .ToListAsync();

        List<UserChallengeProgress> teamSolvedProgresses = new();
        if (teamMembership != null)
        {
            var teamMemberIds = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamMembership.TeamId)
                .Select(tm => tm.UserId)
                .ToListAsync();

            teamSolvedProgresses = await _context.UserChallengeProgresses
                .Where(p => teamMemberIds.Contains(p.UserId) && p.IsSolved)
                .ToListAsync();
        }

        return challenges.Select(c =>
        {
            var myProgress = userProgresses.FirstOrDefault(p => p.ChallengeId == c.Id);
            var teamSolved = teamSolvedProgresses.Any(p => p.ChallengeId == c.Id && p.IsSolved);
            var isSolved = (myProgress?.IsSolved ?? false) || teamSolved;

            var isUnlocked = c.RequiredChallengeId == null ||
                             userProgresses.Any(p => p.ChallengeId == c.RequiredChallengeId && p.IsSolved) ||
                             teamSolvedProgresses.Any(p => p.ChallengeId == c.RequiredChallengeId && p.IsSolved);

            return new ChallengeListItemDto(
                c.Id,
                c.Title,
                c.Description,
                c.Category,
                c.Order,
                c.Points,
                c.HasVM,
                c.Hints,
                c.UnlockContent,
                c.RequiredChallengeId,
                isUnlocked,
                isSolved,
                myProgress?.Attempts ?? 0,
                c.RequiredChallenge?.Title
            );
        }).ToList();
    }

    public async Task<ChallengeDetailDto?> GetChallengeByIdAsync(int challengeId, int userId)
    {
        var challenge = await _context.Challenges
            .Include(c => c.RequiredChallenge)
            .FirstOrDefaultAsync(c => c.Id == challengeId);

        if (challenge == null)
            return null;

        if (challenge.RequiredChallengeId.HasValue)
        {
            var myTeamId = await _context.TeamMembers
                .Where(tm => tm.UserId == userId)
                .Select(tm => (int?)tm.TeamId)
                .FirstOrDefaultAsync();

            var teamMemberIds = new List<int> { userId };

            if (myTeamId.HasValue)
            {
                teamMemberIds = await _context.TeamMembers
                    .Where(tm => tm.TeamId == myTeamId.Value)
                    .Select(tm => tm.UserId)
                    .ToListAsync();

                if (!teamMemberIds.Contains(userId))
                    teamMemberIds.Add(userId);
            }

            var requiredSolved = await _context.UserChallengeProgresses
                .AnyAsync(p => teamMemberIds.Contains(p.UserId)
                               && p.ChallengeId == challenge.RequiredChallengeId.Value
                               && p.IsSolved);

            if (!requiredSolved)
                throw new InvalidOperationException("Bu soruyu açmak için önce önceki soruyu çözmelisiniz");
        }

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId);

        var evidences = await _context.Evidences
            .Where(e => e.ChallengeId == challengeId)
            .OrderBy(e => e.Order)
            .Select(e => new EvidenceDto(
                e.Id,
                e.Title,
                e.Type,
                e.FileUrl,
                e.Description,
                e.Metadata
            ))
            .ToListAsync();

        return new ChallengeDetailDto(
            challenge.Id,
            challenge.Title,
            challenge.Description,
            challenge.Category,
            challenge.Points,
            challenge.HasVM,
            challenge.Files,
            challenge.Hints,
            evidences,
            progress?.IsSolved ?? false,
            progress?.Attempts ?? 0,
            progress?.UsedHints,
            progress?.VMConnectionDetails
        );
    }

    public async Task<SubmitFlagResponse> SubmitFlagAsync(int challengeId, int userId, SubmitFlagRequest request)
    {
        var challenge = await _context.Challenges.FindAsync(challengeId);
        if (challenge == null)
            throw new KeyNotFoundException("Challenge bulunamadı");

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId);

        if (progress == null)
        {
            progress = new UserChallengeProgress
            {
                UserId = userId,
                ChallengeId = challengeId,
                Attempts = 0
            };
            _context.UserChallengeProgresses.Add(progress);
        }

        progress.Attempts++;

        if (!request.Flag.Trim().Equals(challenge.Flag.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            await _context.SaveChangesAsync();
            return new SubmitFlagResponse(false, "Yanlış flag! Tekrar deneyin.", null, null, progress.Attempts);
        }

        if (progress.IsSolved)
            return new SubmitFlagResponse(false, "Bu soruyu zaten çözdünüz");

        progress.IsSolved = true;
        progress.SolvedAt = DateTime.UtcNow;

        var user = await _context.Users.FindAsync(userId);
        if (user != null)
            user.TotalScore += challenge.Points;

        var teamMembership = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.UserId == userId);

        if (teamMembership != null)
        {
            var otherMemberIds = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamMembership.TeamId && tm.UserId != userId)
                .Select(tm => tm.UserId)
                .ToListAsync();

            foreach (var memberId in otherMemberIds)
            {
                var memberProgress = await _context.UserChallengeProgresses
                    .FirstOrDefaultAsync(p => p.UserId == memberId && p.ChallengeId == challengeId);

                if (memberProgress == null)
                {
                    _context.UserChallengeProgresses.Add(new UserChallengeProgress
                    {
                        UserId = memberId,
                        ChallengeId = challengeId,
                        IsSolved = true,
                        SolvedAt = DateTime.UtcNow,
                        TeamId = teamMembership.TeamId
                    });
                }
                else if (!memberProgress.IsSolved)
                {
                    memberProgress.IsSolved = true;
                    memberProgress.SolvedAt = DateTime.UtcNow;
                    memberProgress.TeamId = teamMembership.TeamId;
                }
            }

            var team = await _context.Teams.FindAsync(teamMembership.TeamId);
            if (team != null)
                team.TotalScore += challenge.Points;
        }

        await _context.SaveChangesAsync();

        if (!string.IsNullOrEmpty(challenge.UnlockContent))
        {
            await BoardHub.BroadcastUnlock(_hubContext, _context, userId, challenge.CaseId, challenge.UnlockContent);
        }

        return new SubmitFlagResponse(true, $"Tebrikler! {challenge.Points} puan kazandınız!", challenge.Points, challenge.UnlockContent);
    }

    public async Task<UseHintResponse> UseHintAsync(int challengeId, int userId, UseHintRequest request)
    {
        var challenge = await _context.Challenges.FindAsync(challengeId);
        if (challenge == null)
            throw new KeyNotFoundException("Soru bulunamadı");

        if (string.IsNullOrWhiteSpace(challenge.Hints))
            throw new InvalidOperationException("Bu soruda ipucu yok");

        var hints = JsonSerializer.Deserialize<List<HintItem>>(challenge.Hints);
        if (hints == null || request.HintIndex < 0 || request.HintIndex >= hints.Count)
            throw new InvalidOperationException("Geçersiz ipucu");

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId);

        if (progress == null)
        {
            progress = new UserChallengeProgress
            {
                UserId = userId,
                ChallengeId = challengeId
            };
            _context.UserChallengeProgresses.Add(progress);
        }

        var usedHints = string.IsNullOrWhiteSpace(progress.UsedHints)
            ? new List<int>()
            : JsonSerializer.Deserialize<List<int>>(progress.UsedHints) ?? new List<int>();

        if (usedHints.Contains(request.HintIndex))
        {
            return new UseHintResponse(hints[request.HintIndex].Text, true, 0);
        }

        var hint = hints[request.HintIndex];
        var penalty = (int)Math.Round(challenge.Points * hint.PenaltyPercent / 100.0);

        var user = await _context.Users.FindAsync(userId);
        if (user != null && user.TotalScore >= penalty)
            user.TotalScore -= penalty;

        usedHints.Add(request.HintIndex);
        progress.UsedHints = JsonSerializer.Serialize(usedHints);

        await _context.SaveChangesAsync();

        return new UseHintResponse(hint.Text, false, penalty, hint.PenaltyPercent);
    }

    public async Task<StartVmResponse> StartVmAsync(int challengeId, int userId)
    {
        var challenge = await _context.Challenges.FindAsync(challengeId);
        if (challenge == null || !challenge.HasVM)
            throw new InvalidOperationException("Bu challenge için VM yok");

        var existingVm = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == challengeId && v.UserId == userId && v.Status == "running");

        if (existingVm != null)
        {
            var existingTerminal = await _context.VMInstances
                .FirstOrDefaultAsync(v => v.ChallengeId == null && v.UserId == userId && v.Status == "running");

            int? terminalPort = existingTerminal?.Port;

            if (existingTerminal == null)
            {
                var terminal = await _dockerService.StartWebTerminal(userId, null, existingVm.IPAddress, existingVm.Port);
                if (terminal != null)
                {
                    _context.VMInstances.Add(terminal);
                    await _context.SaveChangesAsync();
                    terminalPort = terminal.Port;
                }
            }

            return new StartVmResponse(
                "VM zaten çalışıyor",
                existingVm.Id,
                existingVm.IPAddress,
                existingVm.Port,
                terminalPort,
                null,
                null,
                existingVm.ExpiresAt
            );
        }

        var vm = await _dockerService.StartVMForChallenge(challenge, userId, null);
        if (vm == null)
            throw new Exception("VM başlatılamadı");

        try
        {
            _context.VMInstances.Add(vm);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "VM kayıt hatası");
            throw new Exception($"VM kayıt hatası: {ex.Message}");
        }

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId);

        if (progress == null)
        {
            progress = new UserChallengeProgress
            {
                UserId = userId,
                ChallengeId = challengeId,
                AssignedVMId = vm.ContainerId,
                VMConnectionDetails = $"{{\"ip\":\"{vm.IPAddress}\",\"port\":{vm.Port}}}"
            };
            _context.UserChallengeProgresses.Add(progress);
        }
        else
        {
            progress.AssignedVMId = vm.ContainerId;
            progress.VMConnectionDetails = $"{{\"ip\":\"{vm.IPAddress}\",\"port\":{vm.Port}}}";
        }

        await _context.SaveChangesAsync();

        int? terminalPortValue = null;
        var terminalVm = await _dockerService.StartWebTerminal(userId, null, vm.IPAddress, vm.Port);
        if (terminalVm != null)
        {
            _context.VMInstances.Add(terminalVm);
            await _context.SaveChangesAsync();
            terminalPortValue = terminalVm.Port;
        }

        var webUrl = challenge.DockerImage != null &&
                     (challenge.DockerImage.Contains("portal") ||
                      challenge.DockerImage.Contains("sqli") ||
                      challenge.DockerImage.Contains("web"))
            ? $"http://{vm.IPAddress}:{vm.Port}"
            : null;

        return new StartVmResponse(
            "VM başlatıldı",
            vm.Id,
            vm.IPAddress,
            vm.Port,
            terminalPortValue,
            null,
            webUrl,
            vm.ExpiresAt
        );
    }

    public async Task<StartVmResponse> StartKaliAsync(int challengeId, int userId)
    {
        var challenge = await _context.Challenges.FindAsync(challengeId);
        if (challenge == null || !challenge.HasVM)
            throw new InvalidOperationException("Bu soru için VM yok");

        var targetVm = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == challengeId && v.UserId == userId && v.Status == "running");

        if (targetVm == null)
            throw new InvalidOperationException("Önce hedef makineyi başlatın");

        var existingKali = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == null && v.UserId == userId &&
                                      v.Status == "running" && v.ContainerName.Contains("kali"));

        if (existingKali != null)
        {
            return new StartVmResponse("Kali zaten çalışıyor", null, null, null, null, existingKali.Port, null, null);
        }

        var kali = await _dockerService.StartKaliDesktop(userId, null, targetVm.IPAddress);
        if (kali == null)
            throw new Exception("Kali başlatılamadı");

        _context.VMInstances.Add(kali);
        await _context.SaveChangesAsync();

        return new StartVmResponse("Kali masaüstü başlatıldı", null, null, null, null, kali.Port, null, null);
    }

    public async Task<string> StopVmAsync(int challengeId, int userId)
    {
        var vm = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == challengeId && v.UserId == userId && v.Status == "running");

        if (vm == null)
            throw new KeyNotFoundException("Çalışan VM bulunamadı");

        var stopped = await _dockerService.StopVM(vm);
        if (!stopped)
            throw new Exception("VM durdurulamadı");

        vm.Status = "stopped";
        await _context.SaveChangesAsync();

        return "VM durduruldu";
    }
}