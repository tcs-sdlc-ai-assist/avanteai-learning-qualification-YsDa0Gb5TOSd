namespace Backend.DTOs;

public sealed class EvidencePreviewRow
{
    public string EmployeeId { get; set; } = string.Empty;
    public string Course { get; set; } = string.Empty;
    public string CompletionDate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class EvidenceUploadResponse
{
    public List<EvidencePreviewRow> Preview { get; set; } = new();
    public int Duplicates { get; set; }
    public int Parsed { get; set; }
    public Guid BatchId { get; set; }
}

public sealed class EvidenceConfirmRequest
{
    public Guid BatchId { get; set; }
}

public sealed class EvidenceResponse
{
    public int EvidenceId { get; set; }
    public Guid BatchId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string Course { get; set; } = string.Empty;
    public DateTime CompletionDate { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Confidence { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ValidateEvidenceRequest
{
    public Guid BatchId { get; set; }
}

public sealed class ValidatedEvidenceRow
{
    public int EvidenceId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string Confidence { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}

public sealed class ValidationExceptionRow
{
    public int ExceptionId { get; set; }
    public int EvidenceId { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime SlaDeadline { get; set; }
}

public sealed class ValidationResult
{
    public List<ValidatedEvidenceRow> Validated { get; set; } = new();
    public List<ValidationExceptionRow> Exceptions { get; set; } = new();
}