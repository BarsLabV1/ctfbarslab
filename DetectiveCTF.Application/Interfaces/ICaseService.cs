using DetectiveCTF.Application.DTOs;

namespace DetectiveCTF.Application.Interfaces;

public interface ICaseService
{
    Task<List<CaseListDto>> GetCasesAsync(int userId);
    Task<CaseDetailDto?> GetCaseByIdAsync(int caseId);
}