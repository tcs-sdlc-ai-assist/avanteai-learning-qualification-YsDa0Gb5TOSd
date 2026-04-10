using Backend.DTOs;
using OfficeOpenXml;

namespace Backend.Services.Parsing;

public class ExcelParser : IFileParser
{
    private static readonly IReadOnlyList<string> _supportedExtensions = new[] { ".xlsx" };

    public IReadOnlyList<string> SupportedExtensions => _supportedExtensions;

    static ExcelParser()
    {
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    public async Task<List<EvidencePreviewRow>> ParseAsync(Stream stream, string fileName)
    {
        if (stream == null)
        {
            throw new ArgumentNullException(nameof(stream));
        }

        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("File name must not be empty.", nameof(fileName));
        }

        var results = new List<EvidencePreviewRow>();

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        using var package = new ExcelPackage(memoryStream);

        if (package.Workbook.Worksheets.Count == 0)
        {
            throw new InvalidOperationException("The Excel file contains no worksheets.");
        }

        var worksheet = package.Workbook.Worksheets[0];

        if (worksheet.Dimension == null)
        {
            return results;
        }

        int totalRows = worksheet.Dimension.End.Row;
        int totalCols = worksheet.Dimension.End.Column;

        if (totalRows < 2)
        {
            return results;
        }

        var headerMap = BuildHeaderMap(worksheet, totalCols);

        int employeeIdCol = ResolveColumn(headerMap, "employeeid", "employee_id", "employee id", "empid", "emp_id");
        int courseCol = ResolveColumn(headerMap, "course", "coursename", "course_name", "course name");
        int completionDateCol = ResolveColumn(headerMap, "completiondate", "completion_date", "completion date", "completed", "date");
        int statusCol = ResolveColumn(headerMap, "status");

        if (employeeIdCol < 0)
        {
            throw new InvalidOperationException("Required column 'EmployeeId' not found in the Excel file.");
        }

        if (courseCol < 0)
        {
            throw new InvalidOperationException("Required column 'Course' not found in the Excel file.");
        }

        if (completionDateCol < 0)
        {
            throw new InvalidOperationException("Required column 'CompletionDate' not found in the Excel file.");
        }

        for (int row = 2; row <= totalRows; row++)
        {
            var employeeId = GetCellText(worksheet, row, employeeIdCol);
            var course = GetCellText(worksheet, row, courseCol);
            var completionDateRaw = GetCellText(worksheet, row, completionDateCol);
            var status = statusCol >= 0 ? GetCellText(worksheet, row, statusCol) : string.Empty;

            if (string.IsNullOrWhiteSpace(employeeId) &&
                string.IsNullOrWhiteSpace(course) &&
                string.IsNullOrWhiteSpace(completionDateRaw))
            {
                continue;
            }

            var completionDate = ParseCompletionDate(worksheet, row, completionDateCol, completionDateRaw);

            if (string.IsNullOrWhiteSpace(status))
            {
                status = "Pending";
            }

            results.Add(new EvidencePreviewRow
            {
                EmployeeId = employeeId?.Trim() ?? string.Empty,
                Course = course?.Trim() ?? string.Empty,
                CompletionDate = completionDate,
                Status = status.Trim()
            });
        }

        return results;
    }

    private static Dictionary<string, int> BuildHeaderMap(ExcelWorksheet worksheet, int totalCols)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (int col = 1; col <= totalCols; col++)
        {
            var headerValue = worksheet.Cells[1, col].Text?.Trim();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                var normalized = headerValue.Replace(" ", "").Replace("_", "").ToLowerInvariant();
                if (!map.ContainsKey(normalized))
                {
                    map[normalized] = col;
                }
            }
        }

        return map;
    }

    private static int ResolveColumn(Dictionary<string, int> headerMap, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            var normalized = candidate.Replace(" ", "").Replace("_", "").ToLowerInvariant();
            if (headerMap.TryGetValue(normalized, out int col))
            {
                return col;
            }
        }

        return -1;
    }

    private static string GetCellText(ExcelWorksheet worksheet, int row, int col)
    {
        var cell = worksheet.Cells[row, col];
        if (cell.Value == null)
        {
            return string.Empty;
        }

        return cell.Text?.Trim() ?? cell.Value.ToString()?.Trim() ?? string.Empty;
    }

    private static string ParseCompletionDate(ExcelWorksheet worksheet, int row, int col, string rawText)
    {
        var cell = worksheet.Cells[row, col];

        if (cell.Value is DateTime dateTimeValue)
        {
            return dateTimeValue.ToString("yyyy-MM-dd");
        }

        if (cell.Value is double oaDate)
        {
            try
            {
                var converted = DateTime.FromOADate(oaDate);
                return converted.ToString("yyyy-MM-dd");
            }
            catch
            {
                // Fall through to string parsing
            }
        }

        if (!string.IsNullOrWhiteSpace(rawText))
        {
            if (DateTime.TryParse(rawText, out var parsed))
            {
                return parsed.ToString("yyyy-MM-dd");
            }
        }

        return rawText?.Trim() ?? string.Empty;
    }
}