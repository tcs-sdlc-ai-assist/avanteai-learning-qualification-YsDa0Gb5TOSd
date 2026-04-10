using System;
using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs
{
    public class AuditLogResponse
    {
        public int Id { get; set; }
        public string Entity { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string User { get; set; } = string.Empty;
        public DateTimeOffset Timestamp { get; set; }
        public string? Details { get; set; }
    }

    public class AuditLogQueryParams
    {
        [MaxLength(64)]
        public string? Entity { get; set; }

        public int? EntityId { get; set; }

        [MaxLength(32)]
        public string? Action { get; set; }

        [MaxLength(128)]
        public string? User { get; set; }

        public DateTimeOffset? From { get; set; }

        public DateTimeOffset? To { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Page must be at least 1.")]
        public int Page { get; set; } = 1;

        [Range(1, 200, ErrorMessage = "PageSize must be between 1 and 200.")]
        public int PageSize { get; set; } = 50;
    }

    public class AuditLogPagedResponse
    {
        public IReadOnlyList<AuditLogResponse> Items { get; set; } = Array.Empty<AuditLogResponse>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    }

    public class CreateAuditLogRequest
    {
        [Required]
        [MaxLength(64)]
        public string Entity { get; set; } = string.Empty;

        [Required]
        public int EntityId { get; set; }

        [Required]
        [MaxLength(32)]
        public string Action { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string UserName { get; set; } = string.Empty;

        [MaxLength(2048)]
        public string? Details { get; set; }
    }
}