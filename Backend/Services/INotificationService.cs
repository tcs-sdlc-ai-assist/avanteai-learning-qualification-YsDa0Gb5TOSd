using Backend.DTOs;

namespace Backend.Services;

public interface INotificationService
{
    /// <summary>
    /// Sends a new notification to a specific user.
    /// </summary>
    /// <param name="userId">The target user's identifier.</param>
    /// <param name="type">The notification type (e.g., "ExceptionAssigned", "EvidenceApproved").</param>
    /// <param name="message">The notification message content.</param>
    /// <returns>The created alert response.</returns>
    Task<AlertResponse> SendNotificationAsync(string userId, string type, string message);

    /// <summary>
    /// Retrieves all unread notifications for a specific user.
    /// </summary>
    /// <param name="userId">The user's identifier.</param>
    /// <returns>A list of unread alert responses.</returns>
    Task<IReadOnlyList<AlertResponse>> GetUnreadAsync(string userId);

    /// <summary>
    /// Marks the specified notifications as read for a given user.
    /// </summary>
    /// <param name="request">The request containing the list of notification IDs to mark as read.</param>
    /// <param name="userId">The user's identifier to ensure ownership.</param>
    /// <returns>A response indicating success or failure.</returns>
    Task<MarkReadResponse> MarkAsReadAsync(MarkReadRequest request, string userId);
}