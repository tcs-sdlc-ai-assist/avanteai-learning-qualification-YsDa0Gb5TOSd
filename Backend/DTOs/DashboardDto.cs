namespace Backend.DTOs;

public sealed class DashboardSummaryResponse
{
    public double ComplianceRate { get; set; }
    public int TotalEvidence { get; set; }
    public int ExceptionsOpen { get; set; }
    public int ExceptionsResolved { get; set; }
    public int PendingCount { get; set; }
    public DateTimeOffset LastUpdated { get; set; }
}

public sealed class ExceptionTrendItem
{
    public string Date { get; set; } = string.Empty;
    public int Open { get; set; }
    public int Resolved { get; set; }
}

public sealed class ExceptionTrendResponse
{
    public List<ExceptionTrendItem> Trend { get; set; } = new();
}

public sealed class OperationalMetric
{
    public string MetricName { get; set; } = string.Empty;
    public double Value { get; set; }
    public string Unit { get; set; } = string.Empty;
    public DateTimeOffset MeasuredAt { get; set; }
}

public sealed class OperationalMetricsResponse
{
    public List<OperationalMetric> Metrics { get; set; } = new();
}