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
    public class PolicyScriptService : IPolicyScriptService
    {
        private readonly IMqttConnection _mqtt;
        private readonly ScriptRepository _repository;
        private readonly IMapper _mapper;

        public PolicyScriptService(IMqttConnection mqtt, ScriptRepository repository, IMapper mapper)
        {
            _mqtt = mqtt;
            _repository = repository;
            _mapper = mapper;
        }

        public async Task<PolicyScriptResponse> AddPolicyScript(AddScriptModel addScriptModel)
        {
            var entity = _mapper.Map<Scripts>(addScriptModel);

            entity.CreatedDate = DateTime.Now;

            var response = await _repository.AddAsync(entity);

            return _mapper.Map<PolicyScriptResponse>(response);
        }

        public async Task<bool> DeleteAllPolicyScript()
        {
            var response = await _repository.DeleteAll();

            return response;
        }

        public async Task<bool> DeletePolicyScriptById(Guid id)
        {
            var response = await (_repository.Delete(id));

            return response;
        }

        public async Task<List<PolicyScriptResponse>> GetAllPolicyScript()
        {
            var response = await _repository.GetAllAsync();

            return _mapper.Map<List<PolicyScriptResponse>>(response);
        }

        public async Task<PolicyScriptResponse> GetPolicyScriptById(Guid id)
        {
            var response = await _repository.GetById(id);

            return _mapper.Map<PolicyScriptResponse>(response);
        }

        public async Task<bool> RunScript(Guid id)
        {
            var script = await _repository.GetById(id);

            if (script == null) return false;

            script.UpdateDate = DateTime.Now;

            await _repository.UpdateAsync(script);

            var response = JsonConvert.SerializeObject(_mapper.Map<PolicyScriptResponse>(script));

            _mqtt.PublishMessageAsync("RE/RunPolicyScript", $"{response}");

            return true;
        }

        public async Task<PolicyScriptResponse> UpdatePolicyScript(UpdateScriptModel updateModel)
        {
            var entity = _mapper.Map<Scripts>(updateModel);

            var response = await _repository.UpdateAsync(entity);

            return _mapper.Map<PolicyScriptResponse>(response);
        }
    }
}