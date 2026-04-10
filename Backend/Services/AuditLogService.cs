using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(AppDbContext dbContext, ILogger<AuditLogService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <inheritdoc />
    public async Task<AuditLogResponse> LogAsync(
        string userId,
        string userName,
        string actionType,
        string entity,
        string entityId,
        string? details = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(userId, nameof(userId));
        ArgumentException.ThrowIfNullOrWhiteSpace(userName, nameof(userName));
        ArgumentException.ThrowIfNullOrWhiteSpace(actionType, nameof(actionType));
        ArgumentException.ThrowIfNullOrWhiteSpace(entity, nameof(entity));
        ArgumentException.ThrowIfNullOrWhiteSpace(entityId, nameof(entityId));

        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = userName,
            ActionType = actionType,
            Entity = entity,
            EntityId = entityId,
            Timestamp = DateTimeOffset.UtcNow,
            Details = details
        };

        _dbContext.AuditLogs.Add(auditLog);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation(
            "Audit log created: {ActionType} on {Entity}/{EntityId} by {UserName}",
            actionType, entity, entityId, userName);

        return MapToResponse(auditLog);
    }

    /// <inheritdoc />
    public async Task<AuditLogPagedResponse> QueryAsync(AuditLogQueryParams queryParams)
    {
        ArgumentNullException.ThrowIfNull(queryParams, nameof(queryParams));

        var query = _dbContext.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.Entity))
        {
            var entityFilter = queryParams.Entity.Trim();
            query = query.Where(al => al.Entity == entityFilter);
        }

        if (queryParams.EntityId.HasValue)
        {
            var entityIdFilter = queryParams.EntityId.Value.ToString();
            query = query.Where(al => al.EntityId == entityIdFilter);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Action))
        {
            var actionFilter = queryParams.Action.Trim();
            query = query.Where(al => al.ActionType == actionFilter);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.User))
        {
            var userFilter = queryParams.User.Trim();
            query = query.Where(al => al.UserName == userFilter);
        }

        if (queryParams.From.HasValue)
        {
            query = query.Where(al => al.Timestamp >= queryParams.From.Value);
        }

        if (queryParams.To.HasValue)
        {
            query = query.Where(al => al.Timestamp <= queryParams.To.Value);
        }

        var totalCount = await query.CountAsync();

        var page = queryParams.Page > 0 ? queryParams.Page : 1;
        var pageSize = queryParams.PageSize > 0 ? queryParams.PageSize : 50;

        var items = await query
            .OrderByDescending(al => al.Timestamp)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new AuditLogPagedResponse
        {
            Items = items.Select(MapToResponse).ToList(),
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    private static AuditLogResponse MapToResponse(AuditLog auditLog)
    {
        _ = int.TryParse(auditLog.EntityId, out var entityIdInt);

        return new AuditLogResponse
        {
            Id = auditLog.Id.GetHashCode(),
            Entity = auditLog.Entity,
            EntityId = entityIdInt,
            Action = auditLog.ActionType,
            User = auditLog.UserName,
            Timestamp = auditLog.Timestamp,
            Details = auditLog.Details
        };
    }
}