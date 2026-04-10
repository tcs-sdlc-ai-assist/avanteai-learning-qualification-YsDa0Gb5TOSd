using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/auditlog")]
[Authorize(Roles = "Admin,Auditor")]
public class AuditLogController : ControllerBase
{
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<AuditLogController> _logger;

    public AuditLogController(IAuditLogService auditLogService, ILogger<AuditLogController> logger)
    {
        _auditLogService = auditLogService;
        _logger = logger;
    }

    /// <summary>
    /// Queries audit log entries with optional filtering by entity, action, user, date range, and pagination.
    /// </summary>
    /// <param name="queryParams">Filter and pagination parameters.</param>
    /// <returns>A paged response of audit log entries.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(AuditLogPagedResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryParams queryParams)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (queryParams.From.HasValue && queryParams.To.HasValue && queryParams.From > queryParams.To)
        {
            return BadRequest(new { error = "Invalid date range", message = "'From' date must be less than or equal to 'To' date." });
        }

        try
        {
            var result = await _auditLogService.QueryAsync(queryParams);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error querying audit logs with params: Entity={Entity}, Action={Action}, User={User}, From={From}, To={To}, Page={Page}, PageSize={PageSize}",
                queryParams.Entity, queryParams.Action, queryParams.User, queryParams.From, queryParams.To, queryParams.Page, queryParams.PageSize);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Internal server error", message = "An error occurred while retrieving audit logs." });
        }
    }
}