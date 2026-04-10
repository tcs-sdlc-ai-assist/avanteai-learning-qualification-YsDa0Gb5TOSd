using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Backend.DTOs;

public class PolicyRuleDto
{
    [Required]
    [StringLength(100)]
    public string Field { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string Operator { get; set; } = string.Empty;

    [Required]
    [StringLength(500)]
    public string Value { get; set; } = string.Empty;
}

public class CreatePolicyRequest
{
    [Required(ErrorMessage = "ProgramId is required.")]
    public Guid ProgramId { get; set; }

    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "At least one rule is required.")]
    [MinLength(1, ErrorMessage = "At least one rule is required.")]
    public List<PolicyRuleDto> Rules { get; set; } = new();
}

public class UpdatePolicyRequest
{
    [Required(ErrorMessage = "Name is required.")]
    [StringLength(100, ErrorMessage = "Name must not exceed 100 characters.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    [StringLength(500, ErrorMessage = "Description must not exceed 500 characters.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "At least one rule is required.")]
    [MinLength(1, ErrorMessage = "At least one rule is required.")]
    public List<PolicyRuleDto> Rules { get; set; } = new();
}

public class PolicyResponse
{
    public Guid Id { get; set; }

    public Guid ProgramId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<PolicyRuleDto> Rules { get; set; } = new();

    public string Status { get; set; } = string.Empty;

    public int Version { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PolicyVersionResponse
{
    public Guid Id { get; set; }

    public Guid PolicyId { get; set; }

    public int Version { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public List<PolicyRuleDto> Rules { get; set; } = new();

    public DateTime CreatedAt { get; set; }

    public Guid CreatedBy { get; set; }
}