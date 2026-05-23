using System.Security.Claims;
using DetectiveCTF.Application.Interfaces;
using DetectiveCTF.Infrastructure.Persistence;
using DetectiveCTF.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.API.Controllers;

[ApiController]
[Route("api/cases")]
[Authorize]
public class CasesController : ControllerBase
{
    private readonly ICaseService _caseService;

    public CasesController(ICaseService caseService)
    {
        _caseService = caseService;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    }

    [HttpGet]
    public async Task<IActionResult> GetCases()
    {
        var userId = GetUserId();
        var result = await _caseService.GetCasesAsync(userId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCase(int id)
    {
        var result = await _caseService.GetCaseByIdAsync(id);
        if (result == null)
            return NotFound(new { message = "Vaka bulunamadı" });
        return Ok(result);
    }

    /* ── Senaryo VM başlat ── */
    [HttpPost("{id}/start-vm")]
    public async Task<IActionResult> StartCaseVM(int id,
        [FromServices] DockerService dockerService,
        [FromServices] AppDbContext db)
    {
        var userId = GetUserId();
        try
        {
            var caseEntity = await db.Cases.FindAsync(id);
            if (caseEntity == null) return NotFound(new { message = "Senaryo bulunamadı" });
            if (!caseEntity.HasVM || string.IsNullOrWhiteSpace(caseEntity.DockerImage))
                return BadRequest(new { message = "Bu senaryo için VM tanımlanmamış" });

            // Zaten çalışan VM var mı?
            var existing = await db.VMInstances
                .FirstOrDefaultAsync(v => v.UserId == userId && v.Status == "running"
                    && v.ContainerName.Contains($"ctf_case_{id}_"));
            if (existing != null)
            {
                var existingPorts = await dockerService.GetCaseVMPorts(existing.ContainerId);
                return Ok(new {
                    ipAddress  = existing.IPAddress,
                    port       = existing.Port,
                    domain     = caseEntity.Domain,
                    ports      = existingPorts,
                    expiresAt  = existing.ExpiresAt,
                    message    = "VM zaten çalışıyor"
                });
            }

            var vm = await dockerService.StartVMForCase(id, caseEntity.DockerImage, userId, null);
            if (vm == null) return StatusCode(500, new { message = "VM başlatılamadı" });

            db.VMInstances.Add(vm);
            await db.SaveChangesAsync();

            var ports = await dockerService.GetCaseVMPorts(vm.ContainerId);

            return Ok(new {
                ipAddress = vm.IPAddress,
                port      = vm.Port,
                domain    = caseEntity.Domain,
                ports     = ports,
                expiresAt = vm.ExpiresAt,
                message   = "VM başlatıldı"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /* ── Senaryo VM durdur ── */
    [HttpPost("{id}/stop-vm")]
    public async Task<IActionResult> StopCaseVM(int id,
        [FromServices] DockerService dockerService,
        [FromServices] AppDbContext db)
    {
        var userId = GetUserId();
        var vm = await db.VMInstances
            .FirstOrDefaultAsync(v => v.UserId == userId && v.Status == "running"
                && v.ContainerName.Contains($"ctf_case_{id}_"));
        if (vm == null) return Ok(new { message = "Çalışan VM yok" });

        await dockerService.StopVM(vm);
        vm.Status = "stopped";
        await db.SaveChangesAsync();
        return Ok(new { message = "VM durduruldu" });
    }

    /* ── Senaryo VM durumu ── */
    [HttpGet("{id}/vm-status")]
    public async Task<IActionResult> GetCaseVMStatus(int id,
        [FromServices] DockerService dockerService,
        [FromServices] AppDbContext db)
    {
        var userId = GetUserId();
        var vm = await db.VMInstances
            .FirstOrDefaultAsync(v => v.UserId == userId && v.Status == "running"
                && v.ContainerName.Contains($"ctf_case_{id}_"));
        if (vm == null) return Ok(new { running = false });

        var ports = await dockerService.GetCaseVMPorts(vm.ContainerId);
        var caseEntity = await db.Cases.FindAsync(id);

        return Ok(new {
            running   = true,
            ipAddress = vm.IPAddress,
            port      = vm.Port,
            domain    = caseEntity?.Domain,
            ports     = ports,
            expiresAt = vm.ExpiresAt
        });
    }
}