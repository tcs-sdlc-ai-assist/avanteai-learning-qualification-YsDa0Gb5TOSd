using Backend.DTOs;

namespace Backend.Services;

public interface IPolicyService
{
    Task<IReadOnlyList<PolicyResponse>> GetAllAsync();

    Task<PolicyResponse?> GetByIdAsync(Guid id);

    Task<PolicyResponse> CreateAsync(CreatePolicyRequest request, Guid userId);

    Task<PolicyResponse> UpdateAsync(Guid id, UpdatePolicyRequest request, Guid userId);

    Task DeleteAsync(Guid id, Guid userId);

    Task<IReadOnlyList<PolicyVersionResponse>> GetVersionsAsync(Guid policyId);
}