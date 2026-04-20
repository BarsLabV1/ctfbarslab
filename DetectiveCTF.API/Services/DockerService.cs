using System.Diagnostics;
using System.Text.Json;
using DetectiveCTF.API.Models;

namespace DetectiveCTF.API.Services;

public class DockerService
{
    private readonly ILogger<DockerService> _logger;

    public DockerService(ILogger<DockerService> logger)
    {
        _logger = logger;
    }

    public async Task<VMInstance?> StartVMForChallenge(Challenge challenge, int? userId, int? teamId)
    {
        try
        {
            if (!challenge.HasVM || string.IsNullOrEmpty(challenge.DockerImage))
            {
                return null;
            }

            var containerName = $"ctf_{challenge.Id}_{(userId.HasValue ? $"user_{userId}" : $"team_{teamId}")}_{Guid.NewGuid().ToString().Substring(0, 8)}";
            
            // Docker container başlat
            var startInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"run -d --name {containerName} -P {challenge.DockerImage}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(startInfo);
            if (process == null)
            {
                _logger.LogError("Failed to start docker process");
                return null;
            }

            await process.WaitForExitAsync();
            var containerId = (await process.StandardOutput.ReadToEndAsync()).Trim();

            if (string.IsNullOrEmpty(containerId))
            {
                _logger.LogError("Failed to get container ID");
                return null;
            }

            // Container IP ve port bilgilerini al
            var inspectInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"inspect {containerId}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var inspectProcess = Process.Start(inspectInfo);
            if (inspectProcess == null)
            {
                return null;
            }

            await inspectProcess.WaitForExitAsync();
            var inspectOutput = await inspectProcess.StandardOutput.ReadToEndAsync();
            
            // IP adresini parse et (basitleştirilmiş)
            var ipAddress = "172.17.0.2"; // Docker default network
            var port = 22; // SSH default port

            var vmInstance = new VMInstance
            {
                ChallengeId = challenge.Id,
                UserId = userId,
                TeamId = teamId,
                ContainerId = containerId,
                ContainerName = containerName,
                IPAddress = ipAddress,
                Port = port,
                Status = "running",
                ExpiresAt = DateTime.UtcNow.AddHours(4) // 4 saat sonra otomatik kapanır
            };

            return vmInstance;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting VM for challenge {ChallengeId}", challenge.Id);
            return null;
        }
    }

    public async Task<bool> StopVM(VMInstance vm)
    {
        try
        {
            var stopInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"stop {vm.ContainerId}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(stopInfo);
            if (process == null) return false;

            await process.WaitForExitAsync();

            // Container'ı sil
            var rmInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"rm {vm.ContainerId}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var rmProcess = Process.Start(rmInfo);
            if (rmProcess == null) return false;

            await rmProcess.WaitForExitAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error stopping VM {ContainerId}", vm.ContainerId);
            return false;
        }
    }

    public async Task<string> GetVMStatus(string containerId)
    {
        try
        {
            var statusInfo = new ProcessStartInfo
            {
                FileName = "docker",
                Arguments = $"inspect -f '{{{{.State.Status}}}}' {containerId}",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(statusInfo);
            if (process == null) return "unknown";

            await process.WaitForExitAsync();
            var status = (await process.StandardOutput.ReadToEndAsync()).Trim();

            return status;
        }
        catch
        {
            return "error";
        }
    }
}
