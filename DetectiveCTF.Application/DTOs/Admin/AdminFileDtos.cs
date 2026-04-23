namespace DetectiveCTF.Application.DTOs.Admin;

public record UploadFileResultDto(
    string FileName,
    string OriginalName,
    string FileUrl,
    string FileType,
    long Size
);