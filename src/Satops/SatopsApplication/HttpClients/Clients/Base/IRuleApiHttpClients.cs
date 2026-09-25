using RuleApplication.Models;
using RuleApplication.Responses;
using SatopsApplication.Responses;

namespace SatopsApplication.HttpClients.Clients.Base
{
    public interface IRuleApiHttpClients
    {
        public Task<PolicyScriptResponse> AddPolicyScript(AddScriptModel addModel);
        public Task<PolicyScriptResponse> GetPolicyScript(Guid id);
        public Task<bool> StartCronPolicy(Guid id, bool status = true);
        public Task<CronPolicyResponse> AddCronPolicy(AddCronPolicyModel addModel);
        public Task<List<ActiveTleResponses>> GetActiveTleResponse(string satelliteName);
        public Task<bool> DeletePolicyScript(Guid id);
    }
}