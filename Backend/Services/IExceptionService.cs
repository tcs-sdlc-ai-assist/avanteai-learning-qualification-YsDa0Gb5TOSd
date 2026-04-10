using Backend.DTOs;

namespace Backend.Services;

public class ExceptionStatsResponse
{
    public int TotalPending { get; set; }
    public int TotalApproved { get; set; }
    public int TotalOverridden { get; set; }
    public int TotalRejected { get; set; }
    public int OverdueSla { get; set; }
}

public interface IExceptionService
{
    Task<ExceptionQueueResponse> GetQueueAsync(int page, int pageSize, string? status = null);

    Task<ExceptionResponse> ProcessActionAsync(int exceptionId, ExceptionActionRequest request, string reviewerId);

    Task<ExceptionStatsResponse> GetStatsAsync();
}