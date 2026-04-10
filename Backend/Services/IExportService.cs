using Backend.DTOs;

namespace Backend.Services;

public interface IExportService
{
    /// <summary>
    /// Exports filtered compliance data as a file stream in the requested format (CSV or JSON).
    /// </summary>
    /// <param name="request">Export parameters including date range, format, and optional filters.</param>
    /// <returns>
    /// A tuple containing the file byte stream, the content type string, and the generated file name.
    /// </returns>
    Task<(Stream FileStream, string ContentType, string FileName, ExportResponse Metadata)> ExportAsync(ExportRequest request);
}