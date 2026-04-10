using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Backend.Models
{
    [Table("PolicyVersions")]
    public class PolicyVersion
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid PolicyId { get; set; }

        [Required]
        [Column("Version")]
        public int VersionNumber { get; set; }

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
        public DateTime CreatedAt { get; set; }

        [Required]
        public Guid CreatedBy { get; set; }

        [ForeignKey(nameof(PolicyId))]
        public Policy Policy { get; set; } = null!;
    }
}