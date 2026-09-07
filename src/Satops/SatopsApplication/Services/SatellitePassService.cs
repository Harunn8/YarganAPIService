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

            Log.Logger = new LoggerConfiguration()
                .WriteTo.Console()
                .CreateLogger();
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

        // Db'ye eklenecek geçişlerin çakışma, öncelikli gibi durumları göz önüne alarak yapılandırmasını sağlayan methottur.
        public async Task<List<SatellitePassResponse>> AddPassesFromTle(List<AddPassesScheduleModel> addPassesFromTleModel)
        {
            var willBeTrackPasses = new List<SatellitePasses>();

            var passes = await GetAllPasses();

            if (passes.Count != 0) await DeleteAllPasses();

            var willBeScheulerPasses = _mapper.Map<List<SatellitePasses>>(addPassesFromTleModel).Where(x => x.AOS > DateTime.Now).ToList();

            var response = await _repository.AddPasses(willBeTrackPasses);

            return _mapper.Map<List<SatellitePassResponse>>(response);
        }


        // Track seçilen geçişlerin çakışma ve öncelik durumlarına göre geçiş planlamalarını yapar ve işlemleri yürütür.
        public async Task<bool> AutoStartOrStop(bool status)
        {
            if (!status)
            {
                var response = await DisableJobs();

                return response;
            }

            _mqtt.PublishMessageAsync("Satops/Jobs", "Auto Scheduler Started");

            var willBeSchedulePasses = await _repository.GetQueryable(x => x.AOS > DateTime.Now && x.Status == PassStatus.SelectTracking);

            if (willBeSchedulePasses.Count == 0) return false;

            var willBeTrackPasses = new List<SatellitePasses>();

            var tleConfiguration = await _tleService.GetTle();

            for (int i = 0; i < willBeSchedulePasses.Count; i++)
            {
                var currentPass = willBeSchedulePasses[i];

                var nextPass = willBeSchedulePasses[i + 1] == null ? null : willBeSchedulePasses[i + 1];

                // Çakışık geçiş durumu varsa, öncelikli geçişleri kontrol eder, yoksa son geçiş önceliklidir.
                if (nextPass != null && IsOverlap(currentPass.AOS, currentPass.LOS, nextPass.AOS, nextPass.LOS, tleConfiguration.SetupInterval))
                {
                    var isImportentPass = willBeSchedulePasses[i].IsImportent ? nextPass : currentPass;

                    isImportentPass.Status = PassStatus.Skipped;

                    Log.Information($"{isImportentPass.Name} AOS {isImportentPass.AOS} skipped");

                    _mqtt.PublishMessageAsync("Satops/Jobs", $"{isImportentPass.Name} AOS {isImportentPass.AOS} skipped");

                    willBeTrackPasses.Add(isImportentPass);

                    if(currentPass.Status != PassStatus.Skipped) willBeTrackPasses.Add(currentPass);                
                }

                willBeTrackPasses.Add(currentPass);
            }

            foreach(var pass in willBeTrackPasses)
            {
                var policyScript = await CreateSatopsScript(pass);

                if(policyScript != null)
                {
                    var cronPolicyModel = new AddCronPolicyModel
                    {
                        Name = policyScript.Name,
                        CronFormat = null,
                        ForOnce = true,
                        StartAt = pass.AOS.AddSeconds(-tleConfiguration.SetupInterval),
                        EndAt = pass.LOS,
                        PolicyScriptId = policyScript.Id
                    };

                    var addCronPolicyResponse = await _ruleapiClient.AddCronPolicy(cronPolicyModel);

                    if (addCronPolicyResponse == null)
                    {
                        _mqtt.PublishMessageAsync("Satops/Jobs", $"{pass.Name} cron job could not created");

                        Log.Error($"{pass.Name} cron job could not create");

                        continue;
                    }

                    var cronPolicyResponse = await _ruleapiClient.StartCronPolicy(addCronPolicyResponse.Id);

                    if (cronPolicyResponse) _mqtt.PublishMessageAsync("Satops/Jobs", $"{pass.Name} job created");

                    Log.Information($"{pass.Name} cron job created");
                }

                Log.Error($"{pass.Name} policy script could not create");
            }

            return true;
        }

        public async Task<bool> DeleteAllPasses()
        {
            var response = await _repository.DeleteAll();

            _mqtt.PublishMessageAsync("Satops/Jobs", "Passes Disabled");

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

        private bool IsOverlap(DateTime pass1AOS, DateTime pass1LOS, DateTime pass2AOS, DateTime pass2LOS, int setupConfigurationTime)
        {
            DateTime pass1Start = pass1AOS;
            DateTime pass1End = pass1LOS.AddSeconds(setupConfigurationTime);
            DateTime pass2Start = pass2AOS;
            DateTime pass2End = pass2LOS;

            return (pass1Start <= pass2Start && pass2Start <= pass1End) ||
                   (pass1Start <= pass2End && pass2End <= pass1End) ||
                   (pass2Start <= pass1Start && pass1Start <= pass2End) ||
                   (pass2Start <= pass1End && pass1End <= pass2End);
        }

        private async Task<bool> DisableJobs()
        {
            var passes = await _repository.GetQueryable(x => x.Status == PassStatus.Queued || x.Status == PassStatus.Tracking || x.Status == PassStatus.SelectTracking);

            if (passes.Count == 0) return false;

            foreach (var pass in passes) pass.Status = PassStatus.Canceled;

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