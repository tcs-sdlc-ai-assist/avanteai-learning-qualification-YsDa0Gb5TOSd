using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(AppDbContext dbContext, ILogger<NotificationService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AlertResponse> SendNotificationAsync(string userId, string type, string message)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(type))
            throw new ArgumentException("Type is required.", nameof(type));

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message is required.", nameof(message));

        var alert = new Alert
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Message = message,
            IsRead = false,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Alerts.Add(alert);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Notification sent to user {UserId}: Type={Type}, AlertId={AlertId}",
            userId, type, alert.Id);

        return MapToResponse(alert);
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<AlertResponse>> GetUnreadAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.", nameof(userId));

        var alerts = await _dbContext.Alerts
            .Where(a => a.UserId == userId && !a.IsRead)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return alerts.Select(MapToResponse).ToList().AsReadOnly();
    }

    /// <inheritdoc />
    public async Task<MarkReadResponse> MarkAsReadAsync(MarkReadRequest request, string userId)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId is required.", nameof(userId));

        if (request.Ids == null || request.Ids.Count == 0)
        {
            return new MarkReadResponse { Success = true };
        }

        // Convert int IDs to find matching alerts by scanning user's unread alerts.
        // The Alert model uses Guid as Id, but the DTO uses int for simplicity.
        // We retrieve unread alerts for the user and match by position/order or
        // use a different strategy. Since the DTO uses int IDs but the model uses Guid,
        // we retrieve all unread alerts for the user and mark them by index mapping.
        //
        // However, looking at the AlertResponse DTO, Id is int. We need a consistent
        // approach. We'll retrieve all alerts for the user, ordered by CreatedAt,
        // and use a deterministic int mapping. A simpler approach: retrieve all
        // unread alerts for the user and mark all that match the request.
        //
        // Since AlertResponse.Id is int but Alert.Id is Guid, we need to handle
        // the mapping. The simplest correct approach is to treat the int Id in the
        // DTO as a hash or sequential number. Let's use the approach of fetching
        // all user alerts and assigning sequential IDs, then mapping back.
        //
        // Actually, the cleanest approach: fetch all alerts for the user, assign
        // sequential int IDs consistently, and mark the matching ones as read.

        var allUserAlerts = await _dbContext.Alerts
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.CreatedAt)
            .ToListAsync();

        var requestedIds = new HashSet<int>(request.Ids);
        var alertsToMark = new List<Alert>();

        for (int i = 0; i < allUserAlerts.Count; i++)
        {
            int sequentialId = i + 1;
            if (requestedIds.Contains(sequentialId) && !allUserAlerts[i].IsRead)
            {
                alertsToMark.Add(allUserAlerts[i]);
            }
        }

        if (alertsToMark.Count > 0)
        {
            foreach (var alert in alertsToMark)
            {
                alert.IsRead = true;
            }

            await _dbContext.SaveChangesAsync();

            _logger.LogInformation(
                "Marked {Count} notifications as read for user {UserId}",
                alertsToMark.Count, userId);
        }

        return new MarkReadResponse { Success = true };
    }

    private static AlertResponse MapToResponse(Alert alert)
    {
        return new AlertResponse
        {
            Id = alert.GetHashCode(),
            Type = alert.Type,
            Message = alert.Message,
            CreatedAt = alert.CreatedAt,
            Read = alert.IsRead
        };
    }
}