using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,SharedServices,Auditor")]
public class ExportController : ControllerBase
{
    private readonly IExportService _exportService;
    private readonly ILogger<ExportController> _logger;

    public ExportController(IExportService exportService, ILogger<ExportController> logger)
    {
        _exportService = exportService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> Export(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] string format = "Csv",
        [FromQuery] string? status = null,
        [FromQuery] string? entity = null)
    {
        if (!Enum.TryParse<ExportFormat>(format, ignoreCase: true, out var exportFormat))
        {
            return BadRequest(new { error = "Format must be 'Csv' or 'Json'.", code = 400 });
        }

        var request = new ExportRequest
        {
            From = from,
            To = to,
            Format = exportFormat,
            Status = status,
            Entity = entity
        };

        var validationErrors = request.Validate();
        if (validationErrors.Count > 0)
        {
            return BadRequest(new { error = string.Join(" ", validationErrors), code = 400 });
        }

        try
        {
            var (fileStream, contentType, fileName, metadata) = await _exportService.ExportAsync(request);

            Response.Headers.Append("X-Total-Records", metadata.TotalRecords.ToString());
            Response.Headers.Append("X-Export-Format", metadata.Format.ToString());
            Response.Headers.Append("X-Generated-At", metadata.GeneratedAt.ToString("o"));

            return File(fileStream, contentType, fileName);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid export request parameters");
            return BadRequest(new { error = ex.Message, code = 400 });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to export data for range {From} to {To} with format {Format}", from, to, format);
            return StatusCode(500, new { error = "An error occurred while generating the export.", code = 500 });
        }
    }
}