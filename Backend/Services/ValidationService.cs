using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ValidationService : IValidationService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<ValidationService> _logger;

    private const decimal HighConfidenceThreshold = 0.85m;
    private const decimal MediumConfidenceThreshold = 0.50m;
    private const int SlaDeadlineDays = 10;

    public ValidationService(
        AppDbContext db,
        IAuditLogService auditLogService,
        ILogger<ValidationService> logger)
    {
        _db = db;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<ValidationResult> ValidateBatchAsync(Guid batchId, string validatedBy)
    {
        var batch = await _db.EvidenceBatches
            .Include(b => b.Evidences)
            .FirstOrDefaultAsync(b => b.Id == batchId);

        if (batch is null)
        {
            throw new KeyNotFoundException($"Batch with ID '{batchId}' was not found.");
        }

        var evidences = batch.Evidences.ToList();

        if (evidences.Count == 0)
        {
            _logger.LogWarning("Batch {BatchId} contains no evidence records to validate.", batchId);
            return new ValidationResult
            {
                Validated = new List<ValidatedEvidenceRow>(),
                Exceptions = new List<ValidationExceptionRow>()
            };
        }

        var activePolicies = await _db.Policies
            .Where(p => p.Status == PolicyStatus.Active)
            .ToListAsync();

        var validatedRows = new List<ValidatedEvidenceRow>();
        var exceptionRows = new List<ValidationExceptionRow>();

        foreach (var evidence in evidences)
        {
            var (confidenceScore, matchResult) = SimulateAiValidation(evidence, activePolicies);

            evidence.ConfidenceScore = confidenceScore;

            if (confidenceScore >= HighConfidenceThreshold)
            {
                evidence.Status = EvidenceStatus.Validated;

                validatedRows.Add(new ValidatedEvidenceRow
                {
                    EvidenceId = GetEvidenceIntId(evidence),
                    EmployeeId = evidence.EmployeeId,
                    Confidence = "High",
                    Status = "validated"
                });
            }
            else if (confidenceScore >= MediumConfidenceThreshold)
            {
                evidence.Status = EvidenceStatus.Validated;

                validatedRows.Add(new ValidatedEvidenceRow
                {
                    EvidenceId = GetEvidenceIntId(evidence),
                    EmployeeId = evidence.EmployeeId,
                    Confidence = "Medium",
                    Status = "validated"
                });
            }
            else
            {
                evidence.Status = EvidenceStatus.Flagged;

                var exceptionRecord = new ExceptionRecord
                {
                    EvidenceId = GetEvidenceIntId(evidence),
                    Reason = matchResult ?? "Low confidence: evidence does not meet policy requirements.",
                    Status = ExceptionStatus.Pending,
                    SlaDeadline = DateTime.UtcNow.AddDays(SlaDeadlineDays),
                    CreatedAt = DateTime.UtcNow
                };

                _db.ExceptionRecords.Add(exceptionRecord);
                await _db.SaveChangesAsync();

                validatedRows.Add(new ValidatedEvidenceRow
                {
                    EvidenceId = GetEvidenceIntId(evidence),
                    EmployeeId = evidence.EmployeeId,
                    Confidence = "Low",
                    Status = "exception"
                });

                exceptionRows.Add(new ValidationExceptionRow
                {
                    ExceptionId = exceptionRecord.Id,
                    EvidenceId = exceptionRecord.EvidenceId,
                    Reason = exceptionRecord.Reason,
                    SlaDeadline = exceptionRecord.SlaDeadline
                });
            }
        }

        batch.Status = BatchStatus.Validated;
        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId: validatedBy,
            userName: validatedBy,
            actionType: "Validate",
            entity: "EvidenceBatch",
            entityId: batchId.ToString(),
            details: $"Validated batch with {evidences.Count} records. " +
                     $"Validated: {validatedRows.Count(r => r.Status == "validated")}, " +
                     $"Exceptions: {exceptionRows.Count}.");

        _logger.LogInformation(
            "Batch {BatchId} validated by {ValidatedBy}. Records: {Total}, Exceptions: {Exceptions}.",
            batchId, validatedBy, evidences.Count, exceptionRows.Count);

        return new ValidationResult
        {
            Validated = validatedRows,
            Exceptions = exceptionRows
        };
    }

    public async Task<ValidatedEvidenceRow> ValidateEvidenceAsync(Guid evidenceId, string validatedBy)
    {
        var evidence = await _db.Evidences
            .FirstOrDefaultAsync(e => e.Id == evidenceId);

        if (evidence is null)
        {
            throw new KeyNotFoundException($"Evidence with ID '{evidenceId}' was not found.");
        }

        var activePolicies = await _db.Policies
            .Where(p => p.Status == PolicyStatus.Active)
            .ToListAsync();

        var (confidenceScore, matchResult) = SimulateAiValidation(evidence, activePolicies);

        evidence.ConfidenceScore = confidenceScore;

        string confidenceLabel;
        string status;

        if (confidenceScore >= HighConfidenceThreshold)
        {
            evidence.Status = EvidenceStatus.Validated;
            confidenceLabel = "High";
            status = "validated";
        }
        else if (confidenceScore >= MediumConfidenceThreshold)
        {
            evidence.Status = EvidenceStatus.Validated;
            confidenceLabel = "Medium";
            status = "validated";
        }
        else
        {
            evidence.Status = EvidenceStatus.Flagged;
            confidenceLabel = "Low";
            status = "exception";

            var exceptionRecord = new ExceptionRecord
            {
                EvidenceId = GetEvidenceIntId(evidence),
                Reason = matchResult ?? "Low confidence: evidence does not meet policy requirements.",
                Status = ExceptionStatus.Pending,
                SlaDeadline = DateTime.UtcNow.AddDays(SlaDeadlineDays),
                CreatedAt = DateTime.UtcNow
            };

            _db.ExceptionRecords.Add(exceptionRecord);
        }

        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId: validatedBy,
            userName: validatedBy,
            actionType: "Validate",
            entity: "Evidence",
            entityId: evidenceId.ToString(),
            details: $"Validated evidence. Confidence: {confidenceLabel}, Status: {status}.");

        _logger.LogInformation(
            "Evidence {EvidenceId} validated by {ValidatedBy}. Confidence: {Confidence}, Status: {Status}.",
            evidenceId, validatedBy, confidenceLabel, status);

        return new ValidatedEvidenceRow
        {
            EvidenceId = GetEvidenceIntId(evidence),
            EmployeeId = evidence.EmployeeId,
            Confidence = confidenceLabel,
            Status = status
        };
    }

    private static (decimal ConfidenceScore, string? Reason) SimulateAiValidation(
        Evidence evidence,
        List<Policy> activePolicies)
    {
        if (activePolicies.Count == 0)
        {
            return (0.40m, "No active policies found for validation.");
        }

        decimal score = 0.50m;

        // Simulate: check if completion date is recent (within last 365 days)
        var daysSinceCompletion = (DateTime.UtcNow - evidence.CompletionDate).TotalDays;
        if (daysSinceCompletion <= 90)
        {
            score += 0.20m;
        }
        else if (daysSinceCompletion <= 365)
        {
            score += 0.10m;
        }
        else
        {
            score -= 0.15m;
        }

        // Simulate: check if employee ID is well-formed (non-empty, reasonable length)
        if (!string.IsNullOrWhiteSpace(evidence.EmployeeId) && evidence.EmployeeId.Length >= 2)
        {
            score += 0.10m;
        }
        else
        {
            score -= 0.10m;
        }

        // Simulate: check if course name matches any policy name (case-insensitive partial match)
        bool courseMatchesPolicy = activePolicies.Any(p =>
            !string.IsNullOrWhiteSpace(p.Name) &&
            (evidence.CourseName.Contains(p.Name, StringComparison.OrdinalIgnoreCase) ||
             p.Name.Contains(evidence.CourseName, StringComparison.OrdinalIgnoreCase)));

        if (courseMatchesPolicy)
        {
            score += 0.25m;
        }
        else
        {
            score -= 0.10m;
        }

        // Simulate: check if employee name is present
        if (!string.IsNullOrWhiteSpace(evidence.EmployeeName) && evidence.EmployeeName.Length >= 2)
        {
            score += 0.05m;
        }

        // Clamp score between 0 and 1
        score = Math.Clamp(score, 0.0m, 1.0m);

        string? reason = null;

        if (score < MediumConfidenceThreshold)
        {
            var reasons = new List<string>();

            if (!courseMatchesPolicy)
            {
                reasons.Add("Course does not match any active policy.");
            }

            if (daysSinceCompletion > 365)
            {
                reasons.Add("Completion date is older than 365 days.");
            }

            if (string.IsNullOrWhiteSpace(evidence.EmployeeId) || evidence.EmployeeId.Length < 2)
            {
                reasons.Add("Employee ID is missing or invalid.");
            }

            reason = reasons.Count > 0
                ? string.Join(" ", reasons)
                : "Low confidence: evidence does not meet policy requirements.";
        }

        return (score, reason);
    }

    private static int GetEvidenceIntId(Evidence evidence)
    {
        // The Evidence entity uses Guid as its primary key, but the DTOs use int for EvidenceId.
        // We use the hash code as a stable integer representation for the DTO layer.
        return Math.Abs(evidence.Id.GetHashCode());
    }
}