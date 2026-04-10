using Backend.DTOs;

namespace Backend.Services;

/// <summary>
/// Defines the contract for the evidence validation engine.
/// Simulates AI-based compliance scoring and exception flagging against policies.
/// </summary>
public interface IValidationService
{
    /// <summary>
    /// Validates all evidence records in a batch, assigning confidence scores
    /// and flagging exceptions for records that do not meet policy requirements.
    /// </summary>
    /// <param name="batchId">The unique identifier of the evidence batch to validate.</param>
    /// <param name="validatedBy">The user ID of the person triggering validation.</param>
    /// <returns>A <see cref="ValidationResult"/> containing validated records and any flagged exceptions.</returns>
    Task<ValidationResult> ValidateBatchAsync(Guid batchId, string validatedBy);

    /// <summary>
    /// Validates a single evidence record, assigning a confidence score
    /// and determining whether it should be flagged as an exception.
    /// </summary>
    /// <param name="evidenceId">The unique identifier of the evidence record to validate.</param>
    /// <param name="validatedBy">The user ID of the person triggering validation.</param>
    /// <returns>A <see cref="ValidatedEvidenceRow"/> with the validation outcome for the record.</returns>
    Task<ValidatedEvidenceRow> ValidateEvidenceAsync(Guid evidenceId, string validatedBy);
}