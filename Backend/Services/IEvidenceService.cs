using Backend.DTOs;
using Microsoft.AspNetCore.Http;

namespace Backend.Services;

public interface IEvidenceService
{
    /// <summary>
    /// Uploads and parses an evidence file (CSV or Excel), deduplicates records,
    /// and returns a preview of parsed rows along with duplicate count and batch identifier.
    /// </summary>
    /// <param name="file">The uploaded evidence file (CSV or XLSX).</param>
    /// <param name="uploadedBy">The identifier of the user performing the upload.</param>
    /// <returns>An <see cref="EvidenceUploadResponse"/> containing the preview, duplicate count, parsed count, and batch ID.</returns>
    Task<EvidenceUploadResponse> UploadAndParseAsync(IFormFile file, string uploadedBy);

    /// <summary>
    /// Confirms a previously uploaded batch, finalizing the evidence records for validation.
    /// </summary>
    /// <param name="request">The confirmation request containing the batch ID.</param>
    /// <returns>A boolean indicating whether the confirmation was successful.</returns>
    Task<bool> ConfirmAsync(EvidenceConfirmRequest request);

    /// <summary>
    /// Retrieves a preview of parsed evidence rows for a given batch.
    /// </summary>
    /// <param name="batchId">The unique identifier of the evidence batch.</param>
    /// <returns>A list of <see cref="EvidencePreviewRow"/> for the specified batch.</returns>
    Task<List<EvidencePreviewRow>> GetPreviewAsync(Guid batchId);

    /// <summary>
    /// Retrieves all evidence records associated with a specific batch.
    /// </summary>
    /// <param name="batchId">The unique identifier of the evidence batch.</param>
    /// <returns>A list of <see cref="EvidenceResponse"/> for the specified batch.</returns>
    Task<List<EvidenceResponse>> GetByBatchAsync(Guid batchId);

    /// <summary>
    /// Retrieves aggregate statistics for evidence records, including counts by status.
    /// </summary>
    /// <returns>A dictionary mapping status names to their respective counts.</returns>
    Task<Dictionary<string, int>> GetStatsAsync();
}