using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

/// <summary>
/// Immutable, append-only audit log entity.
/// Tracks all data modifications with user, action, entity, and timestamp for regulatory traceability.
/// No update or delete operations are permitted on this entity.
/// </summary>
[Table("AuditLogs")]
public class AuditLog
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public Guid Id { get; init; }

    [Required]
    [MaxLength(128)]
    public string UserId { get; init; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string UserName { get; init; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string ActionType { get; init; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string Entity { get; init; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string EntityId { get; init; } = string.Empty;

    [Required]
    public DateTimeOffset Timestamp { get; init; } = DateTimeOffset.UtcNow;

    [MaxLength(2048)]
    public string? Details { get; init; }
}