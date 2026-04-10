using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public enum ExportFormat
    {
        Csv,
        Json
    }

    public class ExportRequest
    {
        [Required]
        public DateTime From { get; set; }

        [Required]
        public DateTime To { get; set; }

        [Required]
        [EnumDataType(typeof(ExportFormat), ErrorMessage = "Format must be 'Csv' or 'Json'.")]
        public ExportFormat Format { get; set; }

        public string? Status { get; set; }

        public string? Entity { get; set; }

        public IReadOnlyList<string> Validate()
        {
            var errors = new List<string>();

            if (From > To)
            {
                errors.Add("'From' date must be less than or equal to 'To' date.");
            }

            if (!Enum.IsDefined(typeof(ExportFormat), Format))
            {
                errors.Add("Format must be 'Csv' or 'Json'.");
            }

            return errors;
        }
    }

    public class ExportResponse
    {
        public string FileName { get; set; } = string.Empty;

        public string ContentType { get; set; } = string.Empty;

        public long FileSizeBytes { get; set; }

        public ExportFormat Format { get; set; }

        public int TotalRecords { get; set; }

        public DateTime From { get; set; }

        public DateTime To { get; set; }

        public string? Status { get; set; }

        public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
    }

    public class ExportRecordDto
    {
        public int EvidenceId { get; set; }

        public string User { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;

        public string? ApprovedBy { get; set; }

        public DateTimeOffset? ApprovedAt { get; set; }

        public string? Entity { get; set; }

        public string? Details { get; set; }

        public DateTimeOffset CreatedAt { get; set; }
    }
}