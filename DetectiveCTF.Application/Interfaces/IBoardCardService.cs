using DetectiveCTF.Application.DTOs;

namespace DetectiveCTF.Application.Interfaces;

public interface IBoardCardService
{
    Task<List<BoardCardDto>> GetCardsAsync(int caseId, int userId);
    Task<List<BoardCardDto>> GetAdminCardsAsync(int caseId, int userId);
    Task<int> CreateAsync(int userId, BoardCardRequest request);
    Task UpdateAsync(int userId, int id, BoardCardRequest request);
    Task DeleteAsync(int userId, int id);
}