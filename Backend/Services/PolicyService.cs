using System.Text.Json;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class PolicyService : IPolicyService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLogService;

    public PolicyService(AppDbContext db, IAuditLogService auditLogService)
    {
        _db = db;
        _auditLogService = auditLogService;
    }

    public async Task<IReadOnlyList<PolicyResponse>> GetAllAsync()
    {
        var policies = await _db.Policies
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return policies.Select(MapToResponse).ToList();
    }

    public async Task<PolicyResponse?> GetByIdAsync(Guid id)
    {
        var policy = await _db.Policies
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return policy is null ? null : MapToResponse(policy);
    }

    public async Task<PolicyResponse> CreateAsync(CreatePolicyRequest request, Guid userId)
    {
        var programExists = await _db.Programs.AnyAsync(p => p.Id == request.ProgramId);
        if (!programExists)
        {
            throw new KeyNotFoundException($"Program with ID '{request.ProgramId}' was not found.");
        }

        var rulesJson = JsonSerializer.Serialize(request.Rules);

        var policy = new Policy
        {
            Id = Guid.NewGuid(),
            ProgramId = request.ProgramId,
            Name = request.Name,
            Description = request.Description,
            Rules = rulesJson,
            Status = PolicyStatus.Active,
            CurrentVersion = 1,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Policies.Add(policy);

        var policyVersion = new PolicyVersion
        {
            Id = Guid.NewGuid(),
            PolicyId = policy.Id,
            VersionNumber = 1,
            Name = request.Name,
            Description = request.Description,
            Rules = rulesJson,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _db.PolicyVersions.Add(policyVersion);

        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Create",
            "Policy",
            policy.Id.ToString(),
            $"Created policy '{policy.Name}' with version 1.");

        return MapToResponse(policy);
    }

    public async Task<PolicyResponse> UpdateAsync(Guid id, UpdatePolicyRequest request, Guid userId)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p => p.Id == id);
        if (policy is null)
        {
            throw new KeyNotFoundException($"Policy with ID '{id}' was not found.");
        }

        var rulesJson = JsonSerializer.Serialize(request.Rules);
        var newVersion = policy.CurrentVersion + 1;

        policy.Name = request.Name;
        policy.Description = request.Description;
        policy.Rules = rulesJson;
        policy.CurrentVersion = newVersion;
        policy.UpdatedAt = DateTime.UtcNow;

        var policyVersion = new PolicyVersion
        {
            Id = Guid.NewGuid(),
            PolicyId = policy.Id,
            VersionNumber = newVersion,
            Name = request.Name,
            Description = request.Description,
            Rules = rulesJson,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId
        };

        _db.PolicyVersions.Add(policyVersion);

        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Update",
            "Policy",
            policy.Id.ToString(),
            $"Updated policy '{policy.Name}' to version {newVersion}.");

        return MapToResponse(policy);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p => p.Id == id);
        if (policy is null)
        {
            throw new KeyNotFoundException($"Policy with ID '{id}' was not found.");
        }

        var policyName = policy.Name;

        _db.Policies.Remove(policy);
        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Delete",
            "Policy",
            id.ToString(),
            $"Deleted policy '{policyName}'.");
    }

    public async Task<IReadOnlyList<PolicyVersionResponse>> GetVersionsAsync(Guid policyId)
    {
        var policyExists = await _db.Policies.AnyAsync(p => p.Id == policyId);
        if (!policyExists)
        {
            throw new KeyNotFoundException($"Policy with ID '{policyId}' was not found.");
        }

        var versions = await _db.PolicyVersions
            .AsNoTracking()
            .Where(pv => pv.PolicyId == policyId)
            .OrderByDescending(pv => pv.VersionNumber)
            .ToListAsync();

        return versions.Select(MapToVersionResponse).ToList();
    }

    private static PolicyResponse MapToResponse(Policy policy)
    {
        List<PolicyRuleDto> rules;
        try
        {
            rules = JsonSerializer.Deserialize<List<PolicyRuleDto>>(policy.Rules) ?? new List<PolicyRuleDto>();
        }
        catch
        {
            rules = new List<PolicyRuleDto>();
        }

        return new PolicyResponse
        {
            Id = policy.Id,
            ProgramId = policy.ProgramId,
            Name = policy.Name,
            Description = policy.Description,
            Rules = rules,
            Status = policy.Status.ToString(),
            Version = policy.CurrentVersion,
            CreatedAt = policy.CreatedAt
        };
    }

    private static PolicyVersionResponse MapToVersionResponse(PolicyVersion version)
    {
        List<PolicyRuleDto> rules;
        try
        {
            rules = JsonSerializer.Deserialize<List<PolicyRuleDto>>(version.Rules) ?? new List<PolicyRuleDto>();
        }
        catch
        {
            rules = new List<PolicyRuleDto>();
        }

        return new PolicyVersionResponse
        {
            Id = version.Id,
            PolicyId = version.PolicyId,
            Version = version.VersionNumber,
            Name = version.Name,
            Description = version.Description,
            Rules = rules,
            CreatedAt = version.CreatedAt,
            CreatedBy = version.CreatedBy
        };
    }
}