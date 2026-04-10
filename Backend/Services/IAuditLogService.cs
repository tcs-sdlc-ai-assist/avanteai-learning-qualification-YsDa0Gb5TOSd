using Backend.DTOs;

namespace Backend.Services;

/// <summary>
/// Provides append-only audit logging and filtered retrieval for regulatory traceability.
/// All audit log entries are immutable — no update or delete operations are permitted.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Appends a new immutable audit log entry.
    /// </summary>
    /// <param name="userId">The ID of the user performing the action.</param>
    /// <param name="userName">The display name of the user performing the action.</param>
    /// <param name="actionType">The type of action performed (e.g., Create, Update, Delete, Approve).</param>
    /// <param name="entity">The entity type affected (e.g., Evidence, Policy, Exception).</param>
    /// <param name="entityId">The identifier of the affected entity.</param>
    /// <param name="details">Optional additional details about the action.</param>
    /// <returns>The created audit log response.</returns>
    Task<AuditLogResponse> LogAsync(
        string userId,
        string userName,
        string actionType,
        string entity,
        string entityId,
        string? details = null);

    /// <summary>
    /// Queries audit log entries with optional filtering, pagination, and ordering.
    /// </summary>
    /// <param name="queryParams">Filter and pagination parameters.</param>
    /// <returns>A paged response containing matching audit log entries.</returns>
    Task<AuditLogPagedResponse> QueryAsync(AuditLogQueryParams queryParams);
}