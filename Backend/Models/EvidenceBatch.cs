using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum BatchStatus
{
    Uploaded,
    Parsed,
    Validated
}

public class EvidenceBatch
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(64)]
    public string UploadedBy { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public int RecordCount { get; set; }

    [Required]
    [Column(TypeName = "varchar(32)")]
    public BatchStatus Status { get; set; } = BatchStatus.Uploaded;

    public ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
}