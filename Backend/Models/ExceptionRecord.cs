using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum ExceptionStatus
{
    Pending,
    Approved,
    Overridden,
    Rejected
}

[Table("Exception")]
public class ExceptionRecord
{
    [Key]
    [Column("ExceptionId")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    [Column("EvidenceId")]
    public int EvidenceId { get; set; }

    [Required]
    [MaxLength(256)]
    [Column("Reason")]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [MaxLength(32)]
    [Column("Status")]
    public ExceptionStatus Status { get; set; } = ExceptionStatus.Pending;

    [Column("Justification")]
    public string? Justification { get; set; }

    [MaxLength(64)]
    [Column("ReviewedBy")]
    public string? ReviewerId { get; set; }

    [Column("ReviewedAt")]
    public DateTime? ReviewedAt { get; set; }

    [Required]
    [Column("SlaDeadline")]
    public DateTime SlaDeadline { get; set; }

    [Required]
    [Column("CreatedAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(EvidenceId))]
    public virtual Evidence Evidence { get; set; } = null!;
}