using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum EvidenceStatus
{
    Pending,
    Validated,
    Flagged,
    Rejected
}

public class Evidence
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid BatchId { get; set; }

    [Required]
    [MaxLength(32)]
    public string EmployeeId { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string EmployeeName { get; set; } = string.Empty;

    [Required]
    [MaxLength(128)]
    public string CourseName { get; set; } = string.Empty;

    [Required]
    public DateTime CompletionDate { get; set; }

    [Required]
    public EvidenceStatus Status { get; set; } = EvidenceStatus.Pending;

    [Column(TypeName = "decimal(5,2)")]
    public decimal ConfidenceScore { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(BatchId))]
    public EvidenceBatch Batch { get; set; } = null!;
}