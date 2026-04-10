using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,LearningManager")]
public class EvidenceController : ControllerBase
{
    private readonly IEvidenceService _evidenceService;
    private readonly IValidationService _validationService;
    private readonly ILogger<EvidenceController> _logger;

    public EvidenceController(
        IEvidenceService evidenceService,
        IValidationService validationService,
        ILogger<EvidenceController> logger)
    {
        _evidenceService = evidenceService;
        _validationService = validationService;
        _logger = logger;
    }

    /// <summary>
    /// Uploads and parses an evidence file (CSV or Excel), deduplicates records,
    /// and returns a preview of parsed rows along with duplicate count and batch identifier.
    /// </summary>
    [HttpPost("upload")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> Upload([FromForm] IFormFile evidenceFile)
    {
        if (evidenceFile == null || evidenceFile.Length == 0)
        {
            return BadRequest(new { error = "No file provided or file is empty." });
        }

        var extension = Path.GetExtension(evidenceFile.FileName)?.ToLowerInvariant();
        if (extension != ".csv" && extension != ".xlsx")
        {
            return BadRequest(new { error = "Invalid file format. Only CSV or Excel (.xlsx) allowed." });
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";

        try
        {
            _logger.LogInformation(
                "Evidence file upload initiated by {UserId}. FileName: {FileName}, Size: {Size} bytes",
                userId, evidenceFile.FileName, evidenceFile.Length);

            var result = await _evidenceService.UploadAndParseAsync(evidenceFile, userId);

            _logger.LogInformation(
                "Evidence file parsed successfully. BatchId: {BatchId}, Parsed: {Parsed}, Duplicates: {Duplicates}",
                result.BatchId, result.Parsed, result.Duplicates);

            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid evidence file uploaded by {UserId}", userId);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during evidence upload by {UserId}", userId);
            return StatusCode(500, new { error = "An unexpected error occurred while processing the file." });
        }
    }

    /// <summary>
    /// Confirms a previously uploaded batch, finalizing the evidence records for validation.
    /// </summary>
    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm([FromBody] EvidenceConfirmRequest request)
    {
        if (request == null || request.BatchId == Guid.Empty)
        {
            return BadRequest(new { error = "A valid BatchId is required." });
        }

        try
        {
            _logger.LogInformation("Evidence batch confirmation requested. BatchId: {BatchId}", request.BatchId);

            var success = await _evidenceService.ConfirmAsync(request);

            if (!success)
            {
                return NotFound(new { error = "Batch not found." });
            }

            _logger.LogInformation("Evidence batch confirmed successfully. BatchId: {BatchId}", request.BatchId);

            return Ok(new { success = true, batchId = request.BatchId });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during evidence batch confirmation. BatchId: {BatchId}", request.BatchId);
            return StatusCode(500, new { error = "An unexpected error occurred while confirming the batch." });
        }
    }

    /// <summary>
    /// Retrieves a preview of parsed evidence rows for a given batch.
    /// </summary>
    [HttpGet("preview/{batchId:guid}")]
    public async Task<IActionResult> Preview(Guid batchId)
    {
        if (batchId == Guid.Empty)
        {
            return BadRequest(new { error = "A valid BatchId is required." });
        }

        try
        {
            _logger.LogInformation("Evidence preview requested for BatchId: {BatchId}", batchId);

            var preview = await _evidenceService.GetPreviewAsync(batchId);

            if (preview == null || preview.Count == 0)
            {
                return NotFound(new { error = "Batch not found or contains no records." });
            }

            return Ok(new { preview, total = preview.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving evidence preview. BatchId: {BatchId}", batchId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving the preview." });
        }
    }

    /// <summary>
    /// Triggers validation of all evidence records in a batch.
    /// </summary>
    [HttpPost("validate")]
    public async Task<IActionResult> Validate([FromBody] ValidateEvidenceRequest request)
    {
        if (request == null || request.BatchId == Guid.Empty)
        {
            return BadRequest(new { error = "A valid BatchId is required." });
        }

        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "unknown";

        try
        {
            _logger.LogInformation(
                "Evidence validation initiated by {UserId} for BatchId: {BatchId}",
                userId, request.BatchId);

            var result = await _validationService.ValidateBatchAsync(request.BatchId, userId);

            _logger.LogInformation(
                "Evidence validation completed. BatchId: {BatchId}, Validated: {ValidatedCount}, Exceptions: {ExceptionCount}",
                request.BatchId, result.Validated.Count, result.Exceptions.Count);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Batch not found for validation. BatchId: {BatchId}", request.BatchId);
            return NotFound(new { error = "Batch not found." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during evidence validation. BatchId: {BatchId}", request.BatchId);
            return StatusCode(500, new { error = "An unexpected error occurred during validation." });
        }
    }

    /// <summary>
    /// Retrieves all evidence records associated with a specific batch.
    /// </summary>
    [HttpGet("batch/{batchId:guid}")]
    public async Task<IActionResult> GetByBatch(Guid batchId)
    {
        if (batchId == Guid.Empty)
        {
            return BadRequest(new { error = "A valid BatchId is required." });
        }

        try
        {
            _logger.LogInformation("Evidence records requested for BatchId: {BatchId}", batchId);

            var records = await _evidenceService.GetByBatchAsync(batchId);

            if (records == null || records.Count == 0)
            {
                return NotFound(new { error = "Batch not found or contains no records." });
            }

            return Ok(new { records, total = records.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving evidence records. BatchId: {BatchId}", batchId);
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving evidence records." });
        }
    }

    /// <summary>
    /// Retrieves aggregate statistics for evidence records.
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            _logger.LogInformation("Evidence statistics requested");

            var stats = await _evidenceService.GetStatsAsync();

            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error retrieving evidence statistics");
            return StatusCode(500, new { error = "An unexpected error occurred while retrieving statistics." });
        }
    }
}