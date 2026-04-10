using Backend.DTOs;

namespace Backend.Services;

public interface IProgramService
{
    Task<List<ProgramResponse>> GetAllAsync();

    Task<ProgramResponse?> GetByIdAsync(Guid id);

    Task<ProgramResponse> CreateAsync(CreateProgramRequest request, Guid userId);

    Task<ProgramResponse> UpdateAsync(Guid id, UpdateProgramRequest request, Guid userId);

    Task DeleteAsync(Guid id, Guid userId);
}