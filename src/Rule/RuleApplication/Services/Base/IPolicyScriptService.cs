using RuleApplication.Models;
using RuleApplication.Responses;

namespace RuleApplication.Services.Base
{
    public interface IPolicyScriptService
    {
        public Task<PolicyScriptResponse> AddPolicyScript(AddScriptModel addScriptModel);
        public Task<List<PolicyScriptResponse>> GetAllPolicyScript();
        public Task<PolicyScriptResponse> GetPolicyScriptById(Guid id);
        public Task<bool> DeletePolicyScriptById(Guid id);
        public Task<bool> DeleteAllPolicyScript();
        public Task<PolicyScriptResponse> UpdatePolicyScript(UpdateScriptModel updateModel);
        public Task<bool> RunScript(Guid id);
    }
}