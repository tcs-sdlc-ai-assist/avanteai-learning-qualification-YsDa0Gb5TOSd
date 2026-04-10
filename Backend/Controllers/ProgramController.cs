using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,LearningManager")]
public class ProgramController : ControllerBase
{
    private readonly IProgramService _programService;
    private readonly ILogger<ProgramController> _logger;

    public ProgramController(IProgramService programService, ILogger<ProgramController> logger)
    {
        _programService = programService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var programs = await _programService.GetAllAsync();
            return Ok(programs);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving programs");
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while retrieving programs." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var program = await _programService.GetByIdAsync(id);
            if (program is null)
            {
                return NotFound(new { error = "NotFound", details = $"Program with ID '{id}' was not found." });
            }
            return Ok(program);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving program {ProgramId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while retrieving the program." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateProgramRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "ValidationError", details = ModelState });
        }

        try
        {
            var userId = GetUserId();
            var program = await _programService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = program.Id }, program);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation error creating program");
            return Conflict(new { error = "ConflictError", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating program");
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while creating the program." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateProgramRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "ValidationError", details = ModelState });
        }

        try
        {
            var userId = GetUserId();
            var program = await _programService.UpdateAsync(id, request, userId);
            return Ok(program);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Validation error updating program {ProgramId}", id);
            return Conflict(new { error = "ConflictError", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating program {ProgramId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while updating the program." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _programService.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting program {ProgramId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while deleting the program." });
        }
    }

    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("User ID claim is missing or invalid.");
        }
        return userId;
    }
}