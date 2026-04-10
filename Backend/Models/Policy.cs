using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models;

public enum PolicyStatus
{
    Active,
    Inactive,
    Draft,
    Archived
}

public class Policy
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid ProgramId { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "jsonb")]
    public string Rules { get; set; } = "[]";

    [Required]
    [MaxLength(20)]
    public PolicyStatus Status { get; set; } = PolicyStatus.Active;

    [Required]
    public int CurrentVersion { get; set; } = 1;

    [Required]
    public Guid CreatedBy { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    [ForeignKey(nameof(ProgramId))]
    public Program Program { get; set; } = null!;

    public ICollection<PolicyVersion> PolicyVersions { get; set; } = new List<PolicyVersion>();
}