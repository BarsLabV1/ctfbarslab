using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.Models;
using DetectiveCTF.API.Services;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChallengesController : ControllerBase
{
    private readonly AppDbContextNew _context;
    private readonly DockerService _dockerService;

    public ChallengesController(AppDbContextNew context, DockerService dockerService)
    {
        _context = context;
        _dockerService = dockerService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet("case/{caseId}")]
    public async Task<ActionResult> GetChallenges(int caseId)
    {
        var userId = GetUserId();
        
        // Kullanıcının takımını bul
        var teamMembership = await _context.TeamMembers
            .FirstOrDefaultAsync(tm => tm.UserId == userId);

        var challenges = await _context.Challenges
            .Include(c => c.RequiredChallenge)
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Order)
            .ToListAsync();

        // Kendi progressleri
        var userProgresses = await _context.UserChallengeProgresses
            .Where(p => p.UserId == userId)
            .ToListAsync();

        // Takım varsa takım üyelerinin progresslerini de al
        List<UserChallengeProgress> teamProgresses = new();
        if (teamMembership != null)
        {
            var teamMemberIds = await _context.TeamMembers
                .Where(tm => tm.TeamId == teamMembership.TeamId)
                .Select(tm => tm.UserId)
                .ToListAsync();

            teamProgresses = await _context.UserChallengeProgresses
                .Where(p => teamMemberIds.Contains(p.UserId) && p.IsSolved)
                .ToListAsync();
        }

        var result = challenges.Select(c =>
        {
            var myProgress   = userProgresses.FirstOrDefault(p => p.ChallengeId == c.Id);
            // Takımdan biri çözdüyse çözülmüş say
            var teamSolved   = teamProgresses.Any(p => p.ChallengeId == c.Id && p.IsSolved);
            var isSolved     = (myProgress?.IsSolved ?? false) || teamSolved;

            var isUnlocked = c.RequiredChallengeId == null ||
                             userProgresses.Any(p => p.ChallengeId == c.RequiredChallengeId && p.IsSolved) ||
                             teamProgresses.Any(p => p.ChallengeId == c.RequiredChallengeId && p.IsSolved);

            return new
            {
                c.Id,
                c.Title,
                c.Description,
                c.Category,
                c.Order,
                c.Points,
                c.HasVM,
                c.Flag,
                c.Hints,
                c.RequiredChallengeId,
                IsUnlocked = isUnlocked,
                IsSolved   = isSolved,
                Attempts   = myProgress?.Attempts ?? 0,
                RequiredChallengeTitle = c.RequiredChallenge?.Title
            };
        }).ToList();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetChallenge(int id)
    {
        var userId = GetUserId();
        
        var challenge = await _context.Challenges
            .Include(c => c.RequiredChallenge)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (challenge == null)
        {
            return NotFound(new { message = "Challenge bulunamadı" });
        }

        // Challenge unlock kontrolü
        if (challenge.RequiredChallengeId.HasValue)
        {
            var requiredSolved = await _context.UserChallengeProgresses
                .AnyAsync(p => p.UserId == userId && 
                             p.ChallengeId == challenge.RequiredChallengeId && 
                             p.IsSolved);

            if (!requiredSolved)
            {
                return BadRequest(new { message = "Bu challenge'ı açmak için önce önceki challenge'ı çözmelisiniz" });
            }
        }

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == id);

        // Evidence'ları al
        var evidences = await _context.Evidences
            .Where(e => e.ChallengeId == id)
            .OrderBy(e => e.Order)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Type,
                e.FileUrl,
                e.Description,
                e.Metadata
            })
            .ToListAsync();

        return Ok(new
        {
            challenge.Id,
            challenge.Title,
            challenge.Description,
            challenge.Category,
            challenge.Points,
            challenge.HasVM,
            Files = challenge.Files,
            Hints = challenge.Hints,
            Evidences = evidences,
            IsSolved = progress?.IsSolved ?? false,
            Attempts = progress?.Attempts ?? 0,
            UsedHints = progress?.UsedHints,
            VMConnectionInfo = progress?.VMConnectionDetails
        });
    }

    [HttpPost("{id}/start-vm")]
    public async Task<ActionResult> StartVM(int id)
    {
        var userId = GetUserId();
        
        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null || !challenge.HasVM)
        {
            return BadRequest(new { message = "Bu challenge için VM yok" });
        }

        // Zaten çalışan VM var mı?
        var existingVM = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == id && v.UserId == userId && v.Status == "running");

        if (existingVM != null)
        {
            return Ok(new
            {
                message = "VM zaten çalışıyor",
                vmId = existingVM.Id,
                ipAddress = existingVM.IPAddress,
                port = existingVM.Port,
                expiresAt = existingVM.ExpiresAt
            });
        }

        // Yeni VM başlat
        var vm = await _dockerService.StartVMForChallenge(challenge, userId, null);
        if (vm == null)
        {
            return StatusCode(500, new { message = "VM başlatılamadı" });
        }

        _context.VMInstances.Add(vm);
        await _context.SaveChangesAsync();

        // Progress kaydı oluştur
        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == id);

        if (progress == null)
        {
            progress = new UserChallengeProgress
            {
                UserId = userId,
                ChallengeId = id,
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

        return Ok(new
        {
            message = "VM başlatıldı",
            vmId = vm.Id,
            ipAddress = vm.IPAddress,
            port = vm.Port,
            expiresAt = vm.ExpiresAt
        });
    }

    [HttpPost("{id}/use-hint")]
    public async Task<ActionResult> UseHint(int id, [FromBody] UseHintRequest request)
    {
        var userId = GetUserId();

        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
            return NotFound(new { message = "Soru bulunamadı" });

        if (string.IsNullOrEmpty(challenge.Hints))
            return BadRequest(new { message = "Bu soruda ipucu yok" });

        var hints = System.Text.Json.JsonSerializer.Deserialize<List<HintItem>>(challenge.Hints);
        if (hints == null || request.HintIndex >= hints.Count)
            return BadRequest(new { message = "Geçersiz ipucu" });

        // Progress kaydını bul veya oluştur
        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == id);

        if (progress == null)
        {
            progress = new UserChallengeProgress { UserId = userId, ChallengeId = id };
            _context.UserChallengeProgresses.Add(progress);
        }

        // Zaten kullanılmış mı?
        var usedHints = string.IsNullOrEmpty(progress.UsedHints)
            ? new List<int>()
            : System.Text.Json.JsonSerializer.Deserialize<List<int>>(progress.UsedHints) ?? new List<int>();

        if (usedHints.Contains(request.HintIndex))
            return Ok(new { text = hints[request.HintIndex].Text, alreadyUsed = true, penalty = 0 });

        // Ceza uygula
        var hint = hints[request.HintIndex];
        var penalty = (int)Math.Round(challenge.Points * hint.PenaltyPercent / 100.0);

        var user = await _context.Users.FindAsync(userId);
        if (user != null && user.TotalScore >= penalty)
            user.TotalScore -= penalty;

        usedHints.Add(request.HintIndex);
        progress.UsedHints = System.Text.Json.JsonSerializer.Serialize(usedHints);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            text = hint.Text,
            alreadyUsed = false,
            penalty = penalty,
            penaltyPercent = hint.PenaltyPercent
        });
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult> SubmitFlag(int id, [FromBody] SubmitFlagRequest request)
    {
        var userId = GetUserId();
        
        var challenge = await _context.Challenges.FindAsync(id);
        if (challenge == null)
        {
            return NotFound(new { message = "Challenge bulunamadı" });
        }

        var progress = await _context.UserChallengeProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == id);

        if (progress == null)
        {
            progress = new UserChallengeProgress
            {
                UserId = userId,
                ChallengeId = id,
                Attempts = 0
            };
            _context.UserChallengeProgresses.Add(progress);
        }

        progress.Attempts++;

        // Flag kontrolü
        if (request.Flag.Trim().Equals(challenge.Flag.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            if (progress.IsSolved)
                return Ok(new { success = false, message = "Bu soruyu zaten çözdünüz" });

            progress.IsSolved = true;
            progress.SolvedAt = DateTime.UtcNow;

            // Kullanıcı puanını güncelle
            var user = await _context.Users.FindAsync(userId);
            if (user != null) user.TotalScore += challenge.Points;

            // Takım varsa: diğer üyelere de progress kaydet (çözülmüş olarak)
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
                        .FirstOrDefaultAsync(p => p.UserId == memberId && p.ChallengeId == id);

                    if (memberProgress == null)
                    {
                        _context.UserChallengeProgresses.Add(new UserChallengeProgress
                        {
                            UserId      = memberId,
                            ChallengeId = id,
                            IsSolved    = true,
                            SolvedAt    = DateTime.UtcNow,
                            TeamId      = teamMembership.TeamId
                        });
                    }
                    else if (!memberProgress.IsSolved)
                    {
                        memberProgress.IsSolved = true;
                        memberProgress.SolvedAt = DateTime.UtcNow;
                        memberProgress.TeamId   = teamMembership.TeamId;
                    }
                }

                // Takım skorunu güncelle
                var team = await _context.Teams.FindAsync(teamMembership.TeamId);
                if (team != null) team.TotalScore += challenge.Points;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Tebrikler! {challenge.Points} puan kazandınız!",
                points  = challenge.Points
            });
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = false,
            message = "Yanlış flag! Tekrar deneyin.",
            attempts = progress.Attempts
        });
    }

    [HttpPost("{id}/stop-vm")]
    public async Task<ActionResult> StopVM(int id)
    {
        var userId = GetUserId();
        
        var vm = await _context.VMInstances
            .FirstOrDefaultAsync(v => v.ChallengeId == id && v.UserId == userId && v.Status == "running");

        if (vm == null)
        {
            return NotFound(new { message = "Çalışan VM bulunamadı" });
        }

        var stopped = await _dockerService.StopVM(vm);
        if (stopped)
        {
            vm.Status = "stopped";
            await _context.SaveChangesAsync();
            return Ok(new { message = "VM durduruldu" });
        }

        return StatusCode(500, new { message = "VM durdurulamadı" });
    }
}

public record SubmitFlagRequest(string Flag);
public record UseHintRequest(int HintIndex);
public record HintItem(string Text, int PenaltyPercent);
