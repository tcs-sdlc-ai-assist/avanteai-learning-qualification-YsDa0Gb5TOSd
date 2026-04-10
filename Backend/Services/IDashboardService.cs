using Backend.DTOs;

namespace Backend.Services;

public interface IDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(string userRole);

    Task<ExceptionTrendResponse> GetExceptionTrendsAsync(DateTimeOffset from, DateTimeOffset to);

    Task<OperationalMetricsResponse> GetOperationalMetricsAsync(string userRole);
}