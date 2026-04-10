using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services.Parsing;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class EvidenceService : IEvidenceService
{
    private readonly AppDbContext _db;
    private readonly IFileParserFactory _fileParserFactory;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<EvidenceService> _logger;

    public EvidenceService(
        AppDbContext db,
        IFileParserFactory fileParserFactory,
        IAuditLogService auditLogService,
        ILogger<EvidenceService> logger)
    {
        _db = db;
        _fileParserFactory = fileParserFactory;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<EvidenceUploadResponse> UploadAndParseAsync(IFormFile file, string uploadedBy)
    {
        ArgumentNullException.ThrowIfNull(file);
        ArgumentException.ThrowIfNullOrWhiteSpace(uploadedBy);

        var extension = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? string.Empty;

        if (!_fileParserFactory.CanParse(extension))
        {
            throw new InvalidOperationException($"Unsupported file format '{extension}'. Only CSV and Excel (.xlsx) files are accepted.");
        }

        _logger.LogInformation("Parsing evidence file {FileName} ({Size} bytes) uploaded by {UploadedBy}",
            file.FileName, file.Length, uploadedBy);

        List<EvidencePreviewRow> parsedRows;
        var parser = _fileParserFactory.GetParser(extension);

        await using var stream = file.OpenReadStream();
        parsedRows = await parser.ParseAsync(stream, file.FileName);

        if (parsedRows.Count == 0)
        {
            throw new InvalidOperationException("The uploaded file contains no valid evidence records.");
        }

        var batchId = Guid.NewGuid();

        var existingKeys = await _db.Evidences
            .Select(e => new { e.EmployeeId, e.CourseName, e.CompletionDate })
            .ToListAsync();

        var existingKeySet = new HashSet<string>(
            existingKeys.Select(e => BuildDeduplicationKey(e.EmployeeId, e.CourseName, e.CompletionDate)));

        var seenInBatch = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var uniqueRows = new List<EvidencePreviewRow>();
        var duplicateCount = 0;

        foreach (var row in parsedRows)
        {
            if (!DateTime.TryParse(row.CompletionDate, out var completionDate))
            {
                row.Status = "invalid";
                uniqueRows.Add(row);
                continue;
            }

            var key = BuildDeduplicationKey(row.EmployeeId, row.Course, completionDate);

            if (existingKeySet.Contains(key) || seenInBatch.Contains(key))
            {
                duplicateCount++;
                row.Status = "duplicate";
                uniqueRows.Add(row);
                continue;
            }

            seenInBatch.Add(key);
            row.Status = "parsed";
            uniqueRows.Add(row);
        }

        var nonDuplicateRows = uniqueRows.Where(r => r.Status == "parsed").ToList();

        var batch = new EvidenceBatch
        {
            Id = batchId,
            FileName = file.FileName,
            UploadedBy = uploadedBy,
            UploadedAt = DateTime.UtcNow,
            RecordCount = nonDuplicateRows.Count,
            Status = BatchStatus.Uploaded
        };

        _db.EvidenceBatches.Add(batch);

        foreach (var row in nonDuplicateRows)
        {
            if (!DateTime.TryParse(row.CompletionDate, out var completionDate))
            {
                continue;
            }

            var evidence = new Evidence
            {
                Id = Guid.NewGuid(),
                BatchId = batchId,
                EmployeeId = row.EmployeeId,
                EmployeeName = row.EmployeeId,
                CourseName = row.Course,
                CompletionDate = completionDate,
                Status = EvidenceStatus.Pending,
                ConfidenceScore = 0m,
                CreatedAt = DateTime.UtcNow
            };

            _db.Evidences.Add(evidence);
        }

        await _db.SaveChangesAsync();

        _logger.LogInformation("Evidence batch {BatchId} created with {RecordCount} records ({Duplicates} duplicates) by {UploadedBy}",
            batchId, nonDuplicateRows.Count, duplicateCount, uploadedBy);

        await _auditLogService.LogAsync(
            uploadedBy,
            uploadedBy,
            "Upload",
            "Evidence",
            batchId.ToString(),
            $"Uploaded file '{file.FileName}' with {nonDuplicateRows.Count} records ({duplicateCount} duplicates).");

        return new EvidenceUploadResponse
        {
            Preview = uniqueRows,
            Duplicates = duplicateCount,
            Parsed = nonDuplicateRows.Count,
            BatchId = batchId
        };
    }

    public async Task<bool> ConfirmAsync(EvidenceConfirmRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        var batch = await _db.EvidenceBatches.FindAsync(request.BatchId);

        if (batch is null)
        {
            _logger.LogWarning("Attempted to confirm non-existent batch {BatchId}", request.BatchId);
            return false;
        }

        if (batch.Status != BatchStatus.Uploaded)
        {
            _logger.LogWarning("Attempted to confirm batch {BatchId} with status {Status}", request.BatchId, batch.Status);
            return false;
        }

        batch.Status = BatchStatus.Parsed;
        await _db.SaveChangesAsync();

        _logger.LogInformation("Batch {BatchId} confirmed and moved to Parsed status", request.BatchId);

        return true;
    }

    public async Task<List<EvidencePreviewRow>> GetPreviewAsync(Guid batchId)
    {
        var evidences = await _db.Evidences
            .Where(e => e.BatchId == batchId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();

        return evidences.Select(e => new EvidencePreviewRow
        {
            EmployeeId = e.EmployeeId,
            Course = e.CourseName,
            CompletionDate = e.CompletionDate.ToString("yyyy-MM-dd"),
            Status = e.Status.ToString().ToLowerInvariant()
        }).ToList();
    }

    public async Task<List<EvidenceResponse>> GetByBatchAsync(Guid batchId)
    {
        var evidences = await _db.Evidences
            .Where(e => e.BatchId == batchId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync();

        return evidences.Select(MapToEvidenceResponse).ToList();
    }

    public async Task<Dictionary<string, int>> GetStatsAsync()
    {
        var stats = await _db.Evidences
            .GroupBy(e => e.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var result = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        foreach (var status in Enum.GetValues<EvidenceStatus>())
        {
            result[status.ToString().ToLowerInvariant()] = 0;
        }

        foreach (var stat in stats)
        {
            result[stat.Status.ToString().ToLowerInvariant()] = stat.Count;
        }

        result["total"] = stats.Sum(s => s.Count);

        return result;
    }

    private static string BuildDeduplicationKey(string employeeId, string course, DateTime completionDate)
    {
        return $"{employeeId.Trim().ToUpperInvariant()}|{course.Trim().ToUpperInvariant()}|{completionDate:yyyy-MM-dd}";
    }

    private static EvidenceResponse MapToEvidenceResponse(Evidence e)
    {
        return new EvidenceResponse
        {
            EvidenceId = e.Id.GetHashCode(),
            BatchId = e.BatchId,
            EmployeeId = e.EmployeeId,
            Course = e.CourseName,
            CompletionDate = e.CompletionDate,
            Status = e.Status.ToString().ToLowerInvariant(),
            Confidence = e.ConfidenceScore > 0 ? MapConfidenceLabel(e.ConfidenceScore) : null,
            CreatedAt = e.CreatedAt
        };
    }

    private static string MapConfidenceLabel(decimal score)
    {
        return score switch
        {
            >= 0.85m => "high",
            >= 0.60m => "medium",
            _ => "low"
        };
    }
}