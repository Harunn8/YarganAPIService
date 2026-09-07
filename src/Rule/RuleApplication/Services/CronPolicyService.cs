using AutoMapper;
using EventBusBrokers.Services.Base;
using Newtonsoft.Json;
using RuleApplication.Models;
using RuleApplication.Responses;
using RuleApplication.Services.Base;
using YarganCore.Entities;
using YarganCore.Repositories;

namespace RuleApplication.Services
{
    public class CronPolicyService : ICronPolicyService
    {
        private readonly CronPolicyRepository _repository;
        private readonly IMqttConnection _mqtt;
        private readonly IMapper _mapper;

        public CronPolicyService(CronPolicyRepository repository, IMqttConnection mqtt, IMapper mapper)
        {
            _repository = repository;
            _mqtt = mqtt;
            _mapper = mapper;
        }

        public async Task<CronPolicyResponse> AddCronPolicy(AddCronPolicyModel addCronPolicyModel)
        {
            var entity = _mapper.Map<CronPolicies>(addCronPolicyModel);

            var response = await _repository.AddAsync(entity);

            return _mapper.Map<CronPolicyResponse>(response);
        }

        public async Task<bool> DeleteCronPolicy(Guid id)
        {
            var response = await _repository.Delete(id);

            return response == true ? true : false;
        }

        public async Task<List<CronPolicyResponse>> GetActiveCronJob()
        {
            var response = await _repository.GetActiveJobs();

            return _mapper.Map<List<CronPolicyResponse>>(response);
        }

        public async Task<List<CronPolicyResponse>> GetAllCronPolicy()
        {
            var response = await _repository.GetAllAsync();

            return _mapper.Map<List<CronPolicyResponse>>(response);
        }

        public async Task<CronPolicyResponse> GetCronPolicyById(Guid id)
        {
            var response = await _repository.GetCronJobById(id);

            return _mapper.Map<CronPolicyResponse>(response);
        }

        public async Task<bool> StartOrStopCronPolicy(Guid id, bool isStart)
        {
            var cronPolicy = await _repository.GetCronJobById(id);

            if (cronPolicy == null) return false;

            cronPolicy.IsRunning = isStart;
            cronPolicy.UpdateDate = DateTime.Now;

            var response = JsonConvert.SerializeObject(_mapper.Map<CronPolicyResponse>(await _repository.UpdateAsync(cronPolicy)));

            if(!isStart) _mqtt.PublishMessageAsync("RuleEngine/DeleteCronJob", $"{response}");

            else _mqtt.PublishMessageAsync("RuleEngine/Run", $"{response}");

            return response != null ? true : false;
        }

        public async Task<CronPolicyResponse> UpdateCronPolicy(UpdateCronPolicyModel updateCronPolicyModel)
        {
            var entity = _mapper.Map<CronPolicies>(updateCronPolicyModel);

            await _repository.UpdateAsync(entity);

            return _mapper.Map<CronPolicyResponse>(entity);
        }
    }
}