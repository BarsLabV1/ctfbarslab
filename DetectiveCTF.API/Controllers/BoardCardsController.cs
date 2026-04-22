using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.Models;
using System.Security.Claims;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/board-cards")]
[Authorize]
public class BoardCardsController : ControllerBase
{
    private readonly AppDbContextNew _context;

    public BoardCardsController(AppDbContextNew context)
    {
        _context = context;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    private async Task<bool> IsAdmin()
    {
        var user = await _context.Users.FindAsync(GetUserId());
        return user?.IsAdmin ?? false;
    }

    /// <summary>Oyuncu için: çözülen sorulara göre açık kartları getir</summary>
    [HttpGet("case/{caseId}")]
    public async Task<ActionResult> GetCards(int caseId)
    {
        var userId = GetUserId();

        // Kullanıcının çözdüğü sorular
        var solvedIds = await _context.UserChallengeProgresses
            .Where(p => p.UserId == userId && p.IsSolved)
            .Select(p => p.ChallengeId)
            .ToListAsync();

        // Takım üyelerinin çözdükleri de dahil
        var teamMembership = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.UserId == userId);

        if (teamMembership != null)
        {
            var teamSolved = await _context.TeamMembers
                .Where(m => m.TeamId == teamMembership.TeamId)
                .SelectMany(m => _context.UserChallengeProgresses
                    .Where(p => p.UserId == m.UserId && p.IsSolved)
                    .Select(p => p.ChallengeId))
                .ToListAsync();
            solvedIds = solvedIds.Union(teamSolved).Distinct().ToList();
        }

        var cards = await _context.BoardCards
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Id)
            .Select(c => new
            {
                c.Id, c.Type, c.Title, c.Content, c.FileUrl, c.ExternalUrl,
                c.DockerImage, c.PosX, c.PosY, c.Rotation, c.Color,
                c.UnlockedByChallenge,
                IsUnlocked = c.UnlockedByChallenge == null ||
                             solvedIds.Contains((int)c.UnlockedByChallenge)
            })
            .ToListAsync();

        return Ok(cards);
    }

    // ── Admin CRUD ──

    [HttpGet("admin/case/{caseId}")]
    public async Task<ActionResult> AdminGetCards(int caseId)
    {
        if (!await IsAdmin()) return Forbid();
        var cards = await _context.BoardCards
            .Where(c => c.CaseId == caseId)
            .OrderBy(c => c.Id)
            .ToListAsync();
        return Ok(cards);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] BoardCardRequest req)
    {
        if (!await IsAdmin()) return Forbid();

        var card = new BoardCard
        {
            CaseId = req.CaseId,
            Type   = req.Type,
            Title  = req.Title,
            Content = req.Content,
            FileUrl = req.FileUrl,
            ExternalUrl = req.ExternalUrl,
            DockerImage = req.DockerImage,
            PosX = req.PosX,
            PosY = req.PosY,
            Rotation = req.Rotation,
            Color = req.Color,
            UnlockedByChallenge = req.UnlockedByChallenge
        };

        _context.BoardCards.Add(card);
        await _context.SaveChangesAsync();
        return Ok(new { id = card.Id, message = "Kart eklendi" });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] BoardCardRequest req)
    {
        if (!await IsAdmin()) return Forbid();

        var card = await _context.BoardCards.FindAsync(id);
        if (card == null) return NotFound();

        card.Type    = req.Type;
        card.Title   = req.Title;
        card.Content = req.Content;
        card.FileUrl = req.FileUrl;
        card.ExternalUrl = req.ExternalUrl;
        card.DockerImage = req.DockerImage;
        card.PosX    = req.PosX;
        card.PosY    = req.PosY;
        card.Rotation = req.Rotation;
        card.Color   = req.Color;
        card.UnlockedByChallenge = req.UnlockedByChallenge;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Kart güncellendi" });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        if (!await IsAdmin()) return Forbid();
        var card = await _context.BoardCards.FindAsync(id);
        if (card == null) return NotFound();
        _context.BoardCards.Remove(card);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Kart silindi" });
    }
}

public record BoardCardRequest(
    int CaseId,
    string Type,
    string Title,
    string? Content,
    string? FileUrl,
    string? ExternalUrl,
    string? DockerImage,
    int PosX,
    int PosY,
    float Rotation,
    string? Color,
    int? UnlockedByChallenge
);
