using System.Security.Claims;
using DetectiveCTF.Core.Interfaces;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.API.Controllers;

/// <summary>
/// Kullanıcıya ait noVNC masaüstü container'larını yönetir.
/// </summary>
[ApiController]
[Route("api/desktop")]
[Authorize]
public class DesktopController : ControllerBase
{
    private readonly IDockerService _docker;
    private readonly AppDbContext _db;

    public DesktopController(IDockerService docker, AppDbContext db)
    {
        _docker = docker;
        _db     = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    // ─────────────────────────────────────────────────────────────
    // POST /api/desktop/start
    // Kullanıcı için masaüstü başlat (zaten varsa mevcut döner)
    // ─────────────────────────────────────────────────────────────
    [HttpPost("start")]
    public async Task<IActionResult> Start()
    {
        var userId = GetUserId();

        try
        {
            var instance = await _docker.StartDesktopAsync(userId);

            return Ok(new
            {
                containerId   = instance.ContainerId,
                containerName = instance.ContainerName,
                assignedPort  = instance.AssignedPort,
                vncUrl        = instance.VncUrl,
                expiryDate    = instance.ExpiryDate,
                status        = instance.Status,
                message       = "Masaüstü hazır"
            });
        }
        catch (InvalidOperationException ex)
        {
            // Port aralığı dolu vb.
            return StatusCode(503, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Masaüstü başlatılamadı: {ex.Message}" });
        }
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/desktop/stop
    // Kullanıcının aktif masaüstünü durdur
    // ─────────────────────────────────────────────────────────────
    [HttpPost("stop")]
    public async Task<IActionResult> Stop()
    {
        var userId = GetUserId();

        var instance = await _db.ActiveInstances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == "running");

        if (instance == null)
            return Ok(new { message = "Çalışan masaüstü yok" });

        await _docker.StopAndRemoveAsync(instance.ContainerId);

        return Ok(new { message = "Masaüstü durduruldu" });
    }

    // ─────────────────────────────────────────────────────────────
    // GET /api/desktop/status
    // Kullanıcının mevcut instance durumunu döndür
    // ─────────────────────────────────────────────────────────────
    [HttpGet("status")]
    public async Task<IActionResult> Status()
    {
        var userId = GetUserId();

        var instance = await _db.ActiveInstances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == "running");

        if (instance == null)
            return Ok(new { running = false });

        // Docker'dan gerçek durumu kontrol et
        var dockerStatus = await _docker.GetContainerStatusAsync(instance.ContainerId);

        // Docker'da artık yoksa DB'yi güncelle
        if (dockerStatus is "not_found" or "exited")
        {
            instance.Status = "stopped";
            await _db.SaveChangesAsync();
            return Ok(new { running = false });
        }

        return Ok(new
        {
            running       = true,
            containerId   = instance.ContainerId,
            containerName = instance.ContainerName,
            assignedPort  = instance.AssignedPort,
            vncUrl        = instance.VncUrl,
            expiryDate    = instance.ExpiryDate,
            dockerStatus
        });
    }

    // ─────────────────────────────────────────────────────────────
    // POST /api/desktop/extend
    // Süreyi 1 saat uzat (max 4 saat)
    // ─────────────────────────────────────────────────────────────
    [HttpPost("extend")]
    public async Task<IActionResult> Extend()
    {
        var userId = GetUserId();

        var instance = await _db.ActiveInstances
            .FirstOrDefaultAsync(a => a.UserId == userId && a.Status == "running");

        if (instance == null)
            return NotFound(new { message = "Aktif masaüstü bulunamadı" });

        var maxExpiry = instance.CreatedAt.AddHours(4);
        var newExpiry = instance.ExpiryDate.AddHours(1);

        if (newExpiry > maxExpiry)
            return BadRequest(new { message = "Maksimum süre 4 saattir" });

        instance.ExpiryDate = newExpiry;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            expiryDate = instance.ExpiryDate,
            message    = "Süre 1 saat uzatıldı"
        });
    }
}
