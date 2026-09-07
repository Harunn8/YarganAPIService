using RuleApplication.Models;
using RuleApplication.Responses;

namespace RuleApplication.Services.Base
{
    public interface ICronPolicyService
    {
        Task<CronPolicyResponse> GetCronPolicyById(Guid id);
        Task<List<CronPolicyResponse>> GetAllCronPolicy();
        Task<CronPolicyResponse> AddCronPolicy(AddCronPolicyModel addCronPolicyModel);
        Task<CronPolicyResponse> UpdateCronPolicy(UpdateCronPolicyModel updateCronPolicyModel);
        Task<bool> DeleteCronPolicy(Guid id);
        Task<bool> StartOrStopCronPolicy(Guid id, bool isStart);
        Task<List<CronPolicyResponse>> GetActiveCronJob();
    }
}
