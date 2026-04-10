using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateProgramRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [StringLength(20, ErrorMessage = "Status must not exceed 20 characters.")]
    public string? Status { get; set; }
}

public class UpdateProgramRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Status is required.")]
    [RegularExpression("^(Active|Inactive|Archived)$", ErrorMessage = "Status must be Active, Inactive, or Archived.")]
    [StringLength(20, ErrorMessage = "Status must not exceed 20 characters.")]
    public string Status { get; set; } = string.Empty;
}

public class ProgramResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}