using Backend.Data;
using Backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;
    private readonly ILogger<DashboardService> _logger;

    public DashboardService(AppDbContext db, ILogger<DashboardService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<DashboardSummaryResponse> GetSummaryAsync(string userRole)
    {
        _logger.LogInformation("Fetching dashboard summary for role {Role}", userRole);

        var totalEvidence = await _db.Evidences.CountAsync();

        var validatedCount = await _db.Evidences
            .Where(e => e.Status == EvidenceStatus.Validated)
            .CountAsync();

        var flaggedCount = await _db.Evidences
            .Where(e => e.Status == EvidenceStatus.Flagged)
            .CountAsync();

        var pendingCount = await _db.Evidences
            .Where(e => e.Status == EvidenceStatus.Pending)
            .CountAsync();

        var exceptionsOpen = await _db.ExceptionRecords
            .Where(er => er.Status == ExceptionStatus.Pending)
            .CountAsync();

        var exceptionsResolved = await _db.ExceptionRecords
            .Where(er => er.Status == ExceptionStatus.Approved
                      || er.Status == ExceptionStatus.Overridden
                      || er.Status == ExceptionStatus.Rejected)
            .CountAsync();

        double complianceRate = totalEvidence > 0
            ? (double)validatedCount / totalEvidence
            : 0.0;

        return new DashboardSummaryResponse
        {
            ComplianceRate = Math.Round(complianceRate, 4),
            TotalEvidence = totalEvidence,
            ExceptionsOpen = exceptionsOpen,
            ExceptionsResolved = exceptionsResolved,
            PendingCount = pendingCount,
            LastUpdated = DateTimeOffset.UtcNow
        };
    }

    public async Task<ExceptionTrendResponse> GetExceptionTrendsAsync(DateTimeOffset from, DateTimeOffset to)
    {
        _logger.LogInformation("Fetching exception trends from {From} to {To}", from, to);

        var fromDate = from.UtcDateTime.Date;
        var toDate = to.UtcDateTime.Date;

        var exceptions = await _db.ExceptionRecords
            .Where(er => er.CreatedAt >= fromDate && er.CreatedAt <= toDate.AddDays(1))
            .Select(er => new
            {
                er.CreatedAt,
                er.Status,
                er.ReviewedAt
            })
            .ToListAsync();

        var trendItems = new List<ExceptionTrendItem>();
        var currentDate = fromDate;

        while (currentDate <= toDate)
        {
            var nextDate = currentDate.AddDays(1);

            var openCount = exceptions
                .Count(er => er.CreatedAt >= currentDate && er.CreatedAt < nextDate
                          && er.Status == ExceptionStatus.Pending);

            var resolvedCount = exceptions
                .Count(er => er.ReviewedAt.HasValue
                          && er.ReviewedAt.Value >= currentDate
                          && er.ReviewedAt.Value < nextDate
                          && (er.Status == ExceptionStatus.Approved
                              || er.Status == ExceptionStatus.Overridden
                              || er.Status == ExceptionStatus.Rejected));

            trendItems.Add(new ExceptionTrendItem
            {
                Date = currentDate.ToString("yyyy-MM-dd"),
                Open = openCount,
                Resolved = resolvedCount
            });

            currentDate = nextDate;
        }

        return new ExceptionTrendResponse
        {
            Trend = trendItems
        };
    }

    public async Task<OperationalMetricsResponse> GetOperationalMetricsAsync(string userRole)
    {
        _logger.LogInformation("Fetching operational metrics for role {Role}", userRole);

        var metrics = new List<OperationalMetric>();
        var now = DateTimeOffset.UtcNow;

        var totalEvidence = await _db.Evidences.CountAsync();
        metrics.Add(new OperationalMetric
        {
            MetricName = "TotalEvidenceRecords",
            Value = totalEvidence,
            Unit = "count",
            MeasuredAt = now
        });

        var validatedCount = await _db.Evidences
            .Where(e => e.Status == EvidenceStatus.Validated)
            .CountAsync();

        double validationRate = totalEvidence > 0
            ? Math.Round((double)validatedCount / totalEvidence * 100, 2)
            : 0.0;

        metrics.Add(new OperationalMetric
        {
            MetricName = "ValidationRate",
            Value = validationRate,
            Unit = "percent",
            MeasuredAt = now
        });

        var pendingExceptions = await _db.ExceptionRecords
            .Where(er => er.Status == ExceptionStatus.Pending)
            .CountAsync();

        metrics.Add(new OperationalMetric
        {
            MetricName = "PendingExceptions",
            Value = pendingExceptions,
            Unit = "count",
            MeasuredAt = now
        });

        var overdueSlaCount = await _db.ExceptionRecords
            .Where(er => er.Status == ExceptionStatus.Pending && er.SlaDeadline < DateTime.UtcNow)
            .CountAsync();

        metrics.Add(new OperationalMetric
        {
            MetricName = "OverdueSlaExceptions",
            Value = overdueSlaCount,
            Unit = "count",
            MeasuredAt = now
        });

        var totalBatches = await _db.EvidenceBatches.CountAsync();
        metrics.Add(new OperationalMetric
        {
            MetricName = "TotalBatches",
            Value = totalBatches,
            Unit = "count",
            MeasuredAt = now
        });

        var flaggedCount = await _db.Evidences
            .Where(e => e.Status == EvidenceStatus.Flagged)
            .CountAsync();

        double flagRate = totalEvidence > 0
            ? Math.Round((double)flaggedCount / totalEvidence * 100, 2)
            : 0.0;

        metrics.Add(new OperationalMetric
        {
            MetricName = "FlagRate",
            Value = flagRate,
            Unit = "percent",
            MeasuredAt = now
        });

        var avgConfidence = totalEvidence > 0
            ? (double)await _db.Evidences.AverageAsync(e => e.ConfidenceScore)
            : 0.0;

        metrics.Add(new OperationalMetric
        {
            MetricName = "AverageConfidenceScore",
            Value = Math.Round(avgConfidence, 2),
            Unit = "score",
            MeasuredAt = now
        });

        return new OperationalMetricsResponse
        {
            Metrics = metrics
        };
    }
}