using AutoMapper;
using EventBusBrokers.Services.Base;
using SatopsApplication.Models;
using SatopsApplication.Responses;
using SatopsApplication.Services.Base;
using YarganCore.Entities;
using YarganCore.Repositories;
using Serilog;
using SatopsApplication.HttpClients.Clients;
using RuleApplication.Models;
using RuleApplication.Responses;
using SatopsApplication.HttpClients.Clients.Base;

namespace SatopsApplication.Services
{
    public class SatellitePassService : ISatellitePassService
    {
        private readonly SatellitePassesRepository _repository;
        private readonly IMqttConnection _mqtt;
        private readonly IMapper _mapper;
        private readonly ITleService _tleService;
        private readonly IRuleApiHttpClients _ruleapiClient;

        public SatellitePassService(SatellitePassesRepository repository, IMqttConnection mqtt, IMapper mapper, ITleService tleService, IRuleApiHttpClients ruleApiClient)
        {
            _repository = repository;
            _mqtt = mqtt;
            _mapper = mapper;
            _tleService = tleService;
            _ruleapiClient = ruleApiClient;
        }

        public async Task<SatellitePassResponse> AddPass(AddSatelliteModel addModel)
        {
            var entity = _mapper.Map<SatellitePasses>(addModel);

            var response = await _repository.AddAsync(entity);

            return _mapper.Map<SatellitePassResponse>(response);
        }

        public async Task<List<SatellitePassResponse>> AddPasses(List<AddSatelliteModel> addModel)
        {
            var entities = _mapper.Map<List<SatellitePasses>>(addModel);

            var response = await _repository.AddPasses(entities);

            return _mapper.Map<List<SatellitePassResponse>>(response);
        }

        // Doğrudan tüm geçişleri Track olarak seçerek ekleyecektir.
        public async Task<List<SatellitePassResponse>> AddPassesFromTle(List<SatellitePassResponseFromTle> addPassesFromTleModel)
        {
            var passes = await GetAllPasses();

            if (passes.Count != 0) await DeleteAllPasses();

            var entities = _mapper.Map<List<SatellitePasses>>(addPassesFromTleModel);

            foreach(var entity in entities)
            {
                if (entity.AOS <= DateTime.Now)
                {
                    Console.WriteLine($"{entity.Name} to skipped");

                    entity.Status = PassStatus.Skipped;
                }

                else entity.Status = PassStatus.SelectTracking;
            }

            var response = await _repository.AddPasses(entities);

            return _mapper.Map<List<SatellitePassResponse>>(response);
        }


        // Db'den bulunan geçişlerin, Tracking status'ları üzerinden işlemleri yapmaktadır. Db'ye AddPasses metodu ile TleService'den gelen geçişler eklenmektedir.
        public async Task<bool> AutoStartOrStop(bool status)
        {
            if (!status) await DisableJobs();
            
            _mqtt.PublishMessageAsync("Satops/Jobs", "Auto Scheduler Started");

            var passes = await _repository.GetQueryable(x => x.IsDeleted == false && x.Status == PassStatus.SelectTracking);

            if(passes.Count == 0)
            {
                Log.Logger.Warning("Could not found any passes");
                return false;
            }

            foreach(var pass in passes)
            {
                if (pass.AOS <= DateTime.Now) continue;

                var passScript = await CreateSatopsScript(pass);

                if(pass == null)
                {
                    Log.Warning($"{pass.Name} could not create.");
                    continue;
                }

                pass.PolicyScriptId = passScript.Id;
                pass.Status = PassStatus.Queued;

                await _repository.UpdateAsync(pass);

                var cronPolicyAddModel = new AddCronPolicyModel
                {
                    Name = $"{pass.Name}_{pass.AOS}",
                    CronFormat = string.Empty,
                    ForOnce = true,
                    StartAt = pass.AOS,
                    EndAt = pass.LOS,
                    PolicyScriptId = pass.PolicyScriptId
                };

                var cronPolicyResponse = await _ruleapiClient.AddCronPolicy(cronPolicyAddModel);

                if (cronPolicyResponse == null) return false;

                var startCronPolicyResponse = await _ruleapiClient.StartCronPolicy(cronPolicyResponse.Id);

                Log.Information($"{pass.Name} queued");
            }

            return true;
        }

        public async Task<bool> DeleteAllPasses()
        {
            var response = await _repository.DeleteAll();

            return response == true ? true : false;
        }

        private async Task<PolicyScriptResponse> CreateSatopsScript(SatellitePasses pass)
        {
            if (pass.PolicyScriptId == Guid.Empty) pass.PolicyScriptId = Guid.Parse("019ffd4d-cee1-77a4-a26b-e13787083c2f"); 

            var policyScript = await _ruleapiClient.GetPolicyScript(pass.PolicyScriptId);

            // Herhangi bir script seçimi yoksa default script atanır.
            if (policyScript == null) policyScript = await _ruleapiClient.GetPolicyScript(Guid.Parse("019ffd4d-cee1-77a4-a26b-e13787083c2f"));
            
            var defaultScript = @$"SendMqttMessage(""Satops/Jobs"",""Pass Started"");
                                    WriteLogToConsole($""{pass.Name} go to start position."");
                                    var snrStauts = GetData(""{Convert.ToString(Guid.NewGuid())}"");
                                    if(snrStatus == null) WriteLogToConsole($""{pass.Name} SNR not found. Tracking stopeed"");";

            var script = defaultScript + policyScript.Script;

            var addPolicyScriptRequest = new AddScriptModel
            {
                Name = $"{pass.Name}_{pass.AOS}",
                Script = script
            };

            var policyScriptResponse = await _ruleapiClient.AddPolicyScript(addPolicyScriptRequest);

            if (policyScriptResponse == null)
            {
                Log.Warning($"Script could not create. {pass.Name} tracking stopped");

                return null;
            }

            return policyScriptResponse;
        }

        private async Task<bool> DisableJobs()
        {
            var passes = await _repository.GetQueryable(x => x.Status == PassStatus.Queued || x.Status == PassStatus.Tracking || x.Status == PassStatus.SelectTracking);

            if (passes.Count == 0) return false;

            foreach(var pass in passes) pass.Status = PassStatus.Canceled;

            _mqtt.PublishMessageAsync("Satops/Jobs", "All Passes Canceled");

            return true;
        }

        public async Task<bool> DeletePassbyId(Guid id)
        {
            var response = await _repository.Delete(id);

            return response == true ? true : false;
        }

        public async Task<List<SatellitePassResponse>> GetAllPasses()
        {
            var response = await _repository.GetAllAsync();

            return _mapper.Map<List<SatellitePassResponse>>(response);
        }

        public async Task<SatellitePassResponse> GetPassById(Guid id)
        {
            var response = await _repository.GetById(id);

            return _mapper.Map<SatellitePassResponse>(response);
        }

        public async Task<SatellitePassResponse> UpdatePass(UpdateSatelliteModel updateModel)
        {
            var entity = _mapper.Map<SatellitePasses>(updateModel);

            var response = await _repository.UpdateAsync(entity);

            return _mapper.Map<SatellitePassResponse>(response);
        }
    }
}