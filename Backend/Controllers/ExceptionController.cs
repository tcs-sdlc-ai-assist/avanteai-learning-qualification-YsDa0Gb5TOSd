using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/exceptions")]
[Authorize(Roles = "Admin,Reviewer")]
public class ExceptionController : ControllerBase
{
    private readonly IExceptionService _exceptionService;
    private readonly ILogger<ExceptionController> _logger;

    public ExceptionController(IExceptionService exceptionService, ILogger<ExceptionController> logger)
    {
        _exceptionService = exceptionService;
        _logger = logger;
    }

    /// <summary>
    /// Returns a paginated list of exception records for review.
    /// </summary>
    [HttpGet("queue")]
    [ProducesResponseType(typeof(ExceptionQueueResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetExceptionQueue(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        if (page < 1)
        {
            return BadRequest(new { error = "Page must be at least 1." });
        }

        if (pageSize < 1 || pageSize > 200)
        {
            return BadRequest(new { error = "PageSize must be between 1 and 200." });
        }

        try
        {
            var result = await _exceptionService.GetQueueAsync(page, pageSize, status);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exception queue. Page={Page}, PageSize={PageSize}, Status={Status}", page, pageSize, status);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred while retrieving the exception queue." });
        }
    }

    /// <summary>
    /// Processes an action (Approve, Override, Reject) on a specific exception.
    /// </summary>
    [HttpPost("{exceptionId}/action")]
    [ProducesResponseType(typeof(ExceptionResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActionException(int exceptionId, [FromBody] ExceptionActionRequest request)
    {
        if (exceptionId <= 0)
        {
            return BadRequest(new { error = "Invalid exception ID." });
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (request.Action == ActionType.Override && string.IsNullOrWhiteSpace(request.Justification))
        {
            return BadRequest(new { error = "Justification required for override." });
        }

        var reviewerId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                      ?? User.FindFirst("sub")?.Value
                      ?? string.Empty;

        if (string.IsNullOrEmpty(reviewerId))
        {
            return Unauthorized(new { error = "Unable to determine reviewer identity." });
        }

        try
        {
            var result = await _exceptionService.ProcessActionAsync(exceptionId, request, reviewerId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Exception record not found. ExceptionId={ExceptionId}", exceptionId);
            return NotFound(new { error = "Exception not found." });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation on exception. ExceptionId={ExceptionId}, Action={Action}", exceptionId, request.Action);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing exception action. ExceptionId={ExceptionId}, Action={Action}", exceptionId, request.Action);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred while processing the exception action." });
        }
    }

    /// <summary>
    /// Returns aggregate statistics for exception records.
    /// </summary>
    [HttpGet("stats")]
    [ProducesResponseType(typeof(ExceptionStatsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var result = await _exceptionService.GetStatsAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving exception statistics.");
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred while retrieving exception statistics." });
        }
    }
}