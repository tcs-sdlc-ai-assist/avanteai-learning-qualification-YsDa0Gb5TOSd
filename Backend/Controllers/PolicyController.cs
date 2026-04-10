using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.DTOs;
using Backend.Services;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,LearningManager")]
public class PoliciesController : ControllerBase
{
    private readonly IPolicyService _policyService;
    private readonly ILogger<PoliciesController> _logger;

    public PoliciesController(IPolicyService policyService, ILogger<PoliciesController> logger)
    {
        _policyService = policyService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var policies = await _policyService.GetAllAsync();
            return Ok(policies);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all policies");
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while retrieving policies." });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var policy = await _policyService.GetByIdAsync(id);
            if (policy is null)
            {
                return NotFound(new { error = "NotFound", details = $"Policy with ID '{id}' was not found." });
            }
            return Ok(policy);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving policy {PolicyId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while retrieving the policy." });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePolicyRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "ValidationError", details = ModelState });
        }

        try
        {
            var userId = GetUserId();
            var policy = await _policyService.CreateAsync(request, userId);
            return CreatedAtAction(nameof(GetById), new { id = policy.Id }, policy);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = "Conflict", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating policy");
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while creating the policy." });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePolicyRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "ValidationError", details = ModelState });
        }

        try
        {
            var userId = GetUserId();
            var policy = await _policyService.UpdateAsync(id, request, userId);
            return Ok(policy);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = "Conflict", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating policy {PolicyId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while updating the policy." });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var userId = GetUserId();
            await _policyService.DeleteAsync(id, userId);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting policy {PolicyId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while deleting the policy." });
        }
    }

    [HttpGet("{id:guid}/versions")]
    public async Task<IActionResult> GetVersions(Guid id)
    {
        try
        {
            var versions = await _policyService.GetVersionsAsync(id);
            return Ok(versions);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = "NotFound", details = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving versions for policy {PolicyId}", id);
            return StatusCode(500, new { error = "InternalError", details = "An error occurred while retrieving policy versions." });
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