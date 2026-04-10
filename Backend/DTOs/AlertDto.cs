namespace Backend.DTOs;

public class AlertResponse
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public bool Read { get; set; }
}

public class MarkReadRequest
{
    public List<int> Ids { get; set; } = new();
}

public class MarkReadResponse
{
    public bool Success { get; set; }
}