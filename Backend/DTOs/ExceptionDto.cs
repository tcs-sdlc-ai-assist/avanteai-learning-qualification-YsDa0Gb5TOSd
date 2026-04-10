namespace Backend.DTOs;

public enum ActionType
{
    Approve,
    Override,
    Reject
}

public sealed class ExceptionQueueItem
{
    public int ExceptionId { get; set; }
    public int EvidenceId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string Course { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime SlaDeadline { get; set; }
}

public sealed class ExceptionActionRequest
{
    public ActionType Action { get; set; }
    public string? Justification { get; set; }
}

public sealed class ExceptionResponse
{
    public string Result { get; set; } = string.Empty;
    public int ExceptionId { get; set; }
}

public sealed class ExceptionQueueResponse
{
    public List<ExceptionQueueItem> Exceptions { get; set; } = new();
    public int Total { get; set; }
}