using DetectiveCTF.Application.DTOs.Admin;
using DetectiveCTF.Application.Interfaces.Admin;
using DetectiveCTF.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DetectiveCTF.Application.Services.Admin;

public class AdminFileService : IAdminFileService
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _environment;

    public AdminFileService(AppDbContext context, IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    public async Task<UploadFileResultDto> UploadAsync(int userId, IFormFile file)
    {
        var isAdmin = await _context.Users.AnyAsync(u => u.Id == userId && u.IsAdmin);
        if (!isAdmin)
            throw new UnauthorizedAccessException("Bu işlem için admin olmalısınız");

        if (file == null || file.Length == 0)
            throw new InvalidOperationException("Dosya seçilmedi");

        if (file.Length > 200 * 1024 * 1024)
            throw new InvalidOperationException("Dosya 200MB'dan büyük olamaz");

        var uploadsDir = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        Directory.CreateDirectory(uploadsDir);

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        var fileType = ext switch
        {
            ".mp4" or ".avi" or ".mov" or ".mkv" or ".webm" => "video",
            ".mp3" or ".wav" or ".ogg" or ".m4a" => "audio",
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" => "image",
            ".pdf" or ".doc" or ".docx" or ".txt" => "document",
            ".log" or ".csv" or ".json" or ".xml" => "log",
            _ => "file"
        };

        return new UploadFileResultDto(
            fileName,
            file.FileName,
            $"/uploads/{fileName}",
            fileType,
            file.Length
        );
    }
}