using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Backend.DTOs;

namespace Backend.Services.Parsing;

public class CsvParser : IFileParser
{
    private static readonly IReadOnlyList<string> _supportedExtensions = new[] { ".csv" };

    public IReadOnlyList<string> SupportedExtensions => _supportedExtensions;

    public async Task<List<EvidencePreviewRow>> ParseAsync(Stream stream, string fileName)
    {
        ArgumentNullException.ThrowIfNull(stream);
        ArgumentNullException.ThrowIfNull(fileName);

        var results = new List<EvidencePreviewRow>();

        using var reader = new StreamReader(stream, leaveOpen: true);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
            MissingFieldFound = null,
            HeaderValidated = null,
            TrimOptions = TrimOptions.Trim,
            IgnoreBlankLines = true,
            BadDataFound = null,
        });

        await csv.ReadAsync();
        csv.ReadHeader();

        var headerRecord = csv.HeaderRecord;
        if (headerRecord == null || headerRecord.Length == 0)
        {
            throw new InvalidOperationException("CSV file contains no header row.");
        }

        var columnMap = BuildColumnMap(headerRecord);

        while (await csv.ReadAsync())
        {
            var row = ParseRow(csv, columnMap);
            if (row != null)
            {
                results.Add(row);
            }
        }

        return results;
    }

    private static ColumnMap BuildColumnMap(string[] headers)
    {
        var map = new ColumnMap();
        var normalized = headers
            .Select((h, i) => new { Header = NormalizeHeader(h), Index = i })
            .ToList();

        map.EmployeeIdIndex = FindColumnIndex(normalized, "employeeid", "employee_id", "empid", "emp_id", "id");
        map.CourseIndex = FindColumnIndex(normalized, "course", "coursename", "course_name", "training", "trainingname", "training_name");
        map.CompletionDateIndex = FindColumnIndex(normalized, "completiondate", "completion_date", "completedon", "completed_on", "dateofcompletion", "date_of_completion", "date");
        map.StatusIndex = FindColumnIndex(normalized, "status", "completionstatus", "completion_status", "result");

        if (map.EmployeeIdIndex < 0)
        {
            throw new InvalidOperationException("CSV file is missing a required 'EmployeeId' column.");
        }

        if (map.CourseIndex < 0)
        {
            throw new InvalidOperationException("CSV file is missing a required 'Course' column.");
        }

        if (map.CompletionDateIndex < 0)
        {
            throw new InvalidOperationException("CSV file is missing a required 'CompletionDate' column.");
        }

        return map;
    }

    private static int FindColumnIndex(List<dynamic> normalized, params string[] candidates)
    {
        foreach (var candidate in candidates)
        {
            var match = normalized.FirstOrDefault(n => (string)n.Header == candidate);
            if (match != null)
            {
                return (int)match.Index;
            }
        }
        return -1;
    }

    private static string NormalizeHeader(string header)
    {
        if (string.IsNullOrWhiteSpace(header))
        {
            return string.Empty;
        }

        return header
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "")
            .Replace("-", "")
            .Replace("_", "");
    }

    private static EvidencePreviewRow? ParseRow(CsvReader csv, ColumnMap map)
    {
        var employeeId = GetField(csv, map.EmployeeIdIndex);
        var course = GetField(csv, map.CourseIndex);
        var completionDateRaw = GetField(csv, map.CompletionDateIndex);

        if (string.IsNullOrWhiteSpace(employeeId) && string.IsNullOrWhiteSpace(course) && string.IsNullOrWhiteSpace(completionDateRaw))
        {
            return null;
        }

        var status = map.StatusIndex >= 0 ? GetField(csv, map.StatusIndex) : string.Empty;

        var completionDate = NormalizeDate(completionDateRaw);

        if (string.IsNullOrWhiteSpace(status))
        {
            status = "Pending";
        }

        return new EvidencePreviewRow
        {
            EmployeeId = employeeId?.Trim() ?? string.Empty,
            Course = course?.Trim() ?? string.Empty,
            CompletionDate = completionDate,
            Status = status.Trim(),
        };
    }

    private static string GetField(CsvReader csv, int index)
    {
        try
        {
            return csv.GetField(index) ?? string.Empty;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string NormalizeDate(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return string.Empty;
        }

        var trimmed = raw.Trim();

        string[] formats =
        [
            "yyyy-MM-dd",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "M/d/yyyy",
            "d/M/yyyy",
            "yyyy/MM/dd",
            "MM-dd-yyyy",
            "dd-MM-yyyy",
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy-MM-ddTHH:mm:ssZ",
            "yyyy-MM-dd HH:mm:ss",
            "MM/dd/yyyy HH:mm:ss",
            "dd/MM/yyyy HH:mm:ss",
        ];

        if (DateTime.TryParseExact(trimmed, formats, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal, out var parsed))
        {
            return parsed.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }

        if (DateTime.TryParse(trimmed, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal, out var fallbackParsed))
        {
            return fallbackParsed.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
        }

        return trimmed;
    }

    private sealed class ColumnMap
    {
        public int EmployeeIdIndex { get; set; } = -1;
        public int CourseIndex { get; set; } = -1;
        public int CompletionDateIndex { get; set; } = -1;
        public int StatusIndex { get; set; } = -1;
    }
}