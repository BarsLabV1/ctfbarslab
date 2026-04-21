using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using DetectiveCTF.API.Data;
using DetectiveCTF.API.Models;
using System.Security.Claims;
using System.Collections.Concurrent;

namespace DetectiveCTF.API.Hubs;

public class BoardHub : Hub
{
    private readonly AppDbContextNew _context;
    // userId → connectionId mapping
    private static readonly ConcurrentDictionary<int, string> _userConnections = new();

    public BoardHub(AppDbContextNew context)
    {
        _context = context;
    }

    private int GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : 0;
    }

    public override Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (userId > 0) _userConnections[userId] = Context.ConnectionId;
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId > 0) _userConnections.TryRemove(userId, out _);
        return base.OnDisconnectedAsync(exception);
    }

    // Client joins a board room (team or solo)
    public async Task JoinBoard(int caseId)
    {
        var userId = GetUserId();
        if (userId == 0) return;

        // Find team
        var membership = await _context.TeamMembers
            .Include(m => m.Team)
            .FirstOrDefaultAsync(m => m.UserId == userId);

        string roomId = membership != null
            ? $"team_{membership.TeamId}_case_{caseId}"
            : $"solo_{userId}_case_{caseId}";

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        // Send current board state to the joining client
        var board = await GetOrCreateBoard(caseId, membership?.TeamId, membership == null ? userId : null);
        await Clients.Caller.SendAsync("BoardLoaded", board.StateJson);
    }

    // Client sends a board update
    public async Task UpdateBoard(int caseId, string stateJson)
    {
        var userId = GetUserId();
        if (userId == 0) return;

        var membership = await _context.TeamMembers
            .FirstOrDefaultAsync(m => m.UserId == userId);

        string roomId = membership != null
            ? $"team_{membership.TeamId}_case_{caseId}"
            : $"solo_{userId}_case_{caseId}";

        // Persist
        var board = await GetOrCreateBoard(caseId, membership?.TeamId, membership == null ? userId : null);
        board.StateJson  = stateJson;
        board.UpdatedAt  = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        // Broadcast to everyone in the room EXCEPT sender
        await Clients.OthersInGroup(roomId).SendAsync("BoardUpdated", stateJson);
    }

    // Broadcast unlock content to OTHER team members (not the solver)
    public static async Task BroadcastUnlock(IHubContext<BoardHub> hubContext, 
        AppDbContextNew context, int userId, int caseId, string unlockContent)
    {
        var membership = await context.TeamMembers
            .FirstOrDefaultAsync(m => m.UserId == userId);

        string roomId = membership != null
            ? $"team_{membership.TeamId}_case_{caseId}"
            : $"solo_{userId}_case_{caseId}";

        // Çözen kişinin connection ID'sini hariç tut
        var excludeConnections = new List<string>();
        if (_userConnections.TryGetValue(userId, out var connId))
            excludeConnections.Add(connId);

        await hubContext.Clients
            .GroupExcept(roomId, excludeConnections)
            .SendAsync("ChallengeUnlocked", unlockContent);
    }

    private async Task<BoardState> GetOrCreateBoard(int caseId, int? teamId, int? userId)
    {
        BoardState? board;

        if (teamId.HasValue)
            board = await _context.BoardStates.FirstOrDefaultAsync(b => b.CaseId == caseId && b.TeamId == teamId);
        else
            board = await _context.BoardStates.FirstOrDefaultAsync(b => b.CaseId == caseId && b.UserId == userId);

        if (board == null)
        {
            board = new BoardState { CaseId = caseId, TeamId = teamId, UserId = userId };
            _context.BoardStates.Add(board);
            await _context.SaveChangesAsync();
        }

        return board;
    }
}
