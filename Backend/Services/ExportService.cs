using System.Globalization;
using System.Text;
using System.Text.Json;
using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;

namespace Backend.Services;

public class ExportService : IExportService
{
    private readonly AppDbContext _dbContext;
    private readonly ILogger<ExportService> _logger;

    public ExportService(AppDbContext dbContext, ILogger<ExportService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<(Stream FileStream, string ContentType, string FileName, ExportResponse Metadata)> ExportAsync(ExportRequest request)
    {
        var validationErrors = request.Validate();
        if (validationErrors.Count > 0)
        {
            throw new ArgumentException(string.Join(" ", validationErrors));
        }

        var fromUtc = DateTime.SpecifyKind(request.From, DateTimeKind.Utc);
        var toUtc = DateTime.SpecifyKind(request.To.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

        var query = _dbContext.Evidences
            .Where(e => e.CreatedAt >= fromUtc && e.CreatedAt <= toUtc);

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (Enum.TryParse<EvidenceStatus>(request.Status, ignoreCase: true, out var statusEnum))
            {
                query = query.Where(e => e.Status == statusEnum);
            }
            else
            {
                throw new ArgumentException($"Invalid status filter: '{request.Status}'. Valid values are: {string.Join(", ", Enum.GetNames<EvidenceStatus>())}.");
            }
        }

        var evidenceRecords = await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExportRecordDto
            {
                EvidenceId = 0,
                User = e.EmployeeId,
                Status = e.Status.ToString(),
                ApprovedBy = null,
                ApprovedAt = null,
                Entity = request.Entity,
                Details = e.CourseName,
                CreatedAt = new DateTimeOffset(e.CreatedAt, TimeSpan.Zero)
            })
            .ToListAsync();

        var exceptionLookup = await _dbContext.ExceptionRecords
            .Where(er => er.Status == ExceptionStatus.Approved || er.Status == ExceptionStatus.Overridden)
            .Where(er => er.ReviewedAt.HasValue)
            .ToDictionaryAsync(er => er.EvidenceId, er => new { er.ReviewerId, er.ReviewedAt });

        for (int i = 0; i < evidenceRecords.Count; i++)
        {
            evidenceRecords[i].EvidenceId = i + 1;
        }

        var evidenceIds = await query.Select(e => e.Id).ToListAsync();

        var evidenceList = await query.ToListAsync();
        var evidenceMap = new Dictionary<Guid, int>();
        for (int i = 0; i < evidenceList.Count; i++)
        {
            evidenceMap[evidenceList[i].Id] = i;
        }

        var exceptions = await _dbContext.ExceptionRecords
            .Where(er => er.ReviewedAt.HasValue)
            .Where(er => er.Status == ExceptionStatus.Approved || er.Status == ExceptionStatus.Overridden)
            .ToListAsync();

        foreach (var ex in exceptions)
        {
            foreach (var evidence in evidenceList)
            {
                if (evidenceMap.TryGetValue(evidence.Id, out var idx) && idx < evidenceRecords.Count)
                {
                    if (ex.ReviewerId != null)
                    {
                        evidenceRecords[idx].ApprovedBy = ex.ReviewerId;
                        evidenceRecords[idx].ApprovedAt = ex.ReviewedAt.HasValue
                            ? new DateTimeOffset(DateTime.SpecifyKind(ex.ReviewedAt.Value, DateTimeKind.Utc))
                            : null;
                    }
                }
            }
        }

        var totalRecords = evidenceRecords.Count;

        _logger.LogInformation(
            "Exporting {TotalRecords} records from {From} to {To} in {Format} format",
            totalRecords, request.From, request.To, request.Format);

        Stream fileStream;
        string contentType;
        string fileName;

        var timestamp = DateTimeOffset.UtcNow.ToString("yyyyMMdd_HHmmss");

        switch (request.Format)
        {
            case ExportFormat.Csv:
                fileStream = GenerateCsvStream(evidenceRecords);
                contentType = "text/csv";
                fileName = $"compliance_export_{timestamp}.csv";
                break;

            case ExportFormat.Json:
                fileStream = GenerateJsonStream(evidenceRecords);
                contentType = "application/json";
                fileName = $"compliance_export_{timestamp}.json";
                break;

            default:
                throw new ArgumentException($"Unsupported export format: {request.Format}");
        }

        var metadata = new ExportResponse
        {
            FileName = fileName,
            ContentType = contentType,
            FileSizeBytes = fileStream.Length,
            Format = request.Format,
            TotalRecords = totalRecords,
            From = request.From,
            To = request.To,
            Status = request.Status,
            GeneratedAt = DateTimeOffset.UtcNow
        };

        fileStream.Position = 0;

        return (fileStream, contentType, fileName, metadata);
    }

    private static MemoryStream GenerateCsvStream(List<ExportRecordDto> records)
    {
        var memoryStream = new MemoryStream();
        using (var writer = new StreamWriter(memoryStream, Encoding.UTF8, leaveOpen: true))
        using (var csv = new CsvWriter(writer, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            HasHeaderRecord = true,
        }))
        {
            csv.Context.RegisterClassMap<ExportRecordCsvMap>();
            csv.WriteRecords(records);
            writer.Flush();
        }

        memoryStream.Position = 0;
        return memoryStream;
    }

    private static MemoryStream GenerateJsonStream(List<ExportRecordDto> records)
    {
        var memoryStream = new MemoryStream();

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        JsonSerializer.Serialize(memoryStream, records, options);

        memoryStream.Position = 0;
        return memoryStream;
    }

    private sealed class ExportRecordCsvMap : ClassMap<ExportRecordDto>
    {
        public ExportRecordCsvMap()
        {
            Map(m => m.EvidenceId).Name("EvidenceId").Index(0);
            Map(m => m.User).Name("User").Index(1);
            Map(m => m.Status).Name("Status").Index(2);
            Map(m => m.ApprovedBy).Name("ApprovedBy").Index(3);
            Map(m => m.ApprovedAt).Name("ApprovedAt").Index(4)
                .TypeConverterOption.Format("o");
            Map(m => m.Entity).Name("Entity").Index(5);
            Map(m => m.Details).Name("Details").Index(6);
            Map(m => m.CreatedAt).Name("CreatedAt").Index(7)
                .TypeConverterOption.Format("o");
        }
    }
}