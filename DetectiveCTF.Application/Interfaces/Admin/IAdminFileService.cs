using DetectiveCTF.Application.DTOs.Admin;
using Microsoft.AspNetCore.Http;

namespace DetectiveCTF.Application.Interfaces.Admin;

public interface IAdminFileService
{
    Task<UploadFileResultDto> UploadAsync(int userId, IFormFile file);
}