using System.Text.Json;
using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class ProgramService : IProgramService
{
    private readonly AppDbContext _db;
    private readonly IAuditLogService _auditLogService;

    public ProgramService(AppDbContext db, IAuditLogService auditLogService)
    {
        _db = db;
        _auditLogService = auditLogService;
    }

    public async Task<List<ProgramResponse>> GetAllAsync()
    {
        var programs = await _db.Programs
            .AsNoTracking()
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return programs.Select(MapToResponse).ToList();
    }

    public async Task<ProgramResponse?> GetByIdAsync(Guid id)
    {
        var program = await _db.Programs
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return program is null ? null : MapToResponse(program);
    }

    public async Task<ProgramResponse> CreateAsync(CreateProgramRequest request, Guid userId)
    {
        var program = new Backend.Models.Program
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            Status = ParseStatus(request.Status),
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Programs.Add(program);
        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Create",
            "Program",
            program.Id.ToString(),
            $"Created program '{program.Name}' with status '{program.Status}'.");

        return MapToResponse(program);
    }

    public async Task<ProgramResponse> UpdateAsync(Guid id, UpdateProgramRequest request, Guid userId)
    {
        var program = await _db.Programs.FirstOrDefaultAsync(p => p.Id == id);

        if (program is null)
        {
            throw new KeyNotFoundException($"Program with ID '{id}' was not found.");
        }

        var previousName = program.Name;
        var previousStatus = program.Status.ToString();

        program.Name = request.Name;
        program.Description = request.Description;
        program.Status = Enum.Parse<ProgramStatus>(request.Status, ignoreCase: true);
        program.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Update",
            "Program",
            program.Id.ToString(),
            $"Updated program '{previousName}' (status: '{previousStatus}' -> '{program.Status}').");

        return MapToResponse(program);
    }

    public async Task DeleteAsync(Guid id, Guid userId)
    {
        var program = await _db.Programs.FirstOrDefaultAsync(p => p.Id == id);

        if (program is null)
        {
            throw new KeyNotFoundException($"Program with ID '{id}' was not found.");
        }

        var programName = program.Name;

        _db.Programs.Remove(program);
        await _db.SaveChangesAsync();

        await _auditLogService.LogAsync(
            userId.ToString(),
            userId.ToString(),
            "Delete",
            "Program",
            id.ToString(),
            $"Deleted program '{programName}'.");
    }

    private static ProgramResponse MapToResponse(Backend.Models.Program program)
    {
        return new ProgramResponse
        {
            Id = program.Id,
            Name = program.Name,
            Description = program.Description,
            Status = program.Status.ToString(),
            CreatedAt = program.CreatedAt
        };
    }

    private static ProgramStatus ParseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return ProgramStatus.Draft;
        }

        if (Enum.TryParse<ProgramStatus>(status, ignoreCase: true, out var parsed))
        {
            return parsed;
        }

        return ProgramStatus.Draft;
    }
}