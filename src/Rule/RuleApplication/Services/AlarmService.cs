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
    public class AlarmService : IAlarmService
    {
        private readonly AlarmRepository _repository;
        private readonly IMqttConnection _mqtt;
        private readonly IMapper _mapper;

        public AlarmService(AlarmRepository repository, IMqttConnection mqtt, IMapper mapper)
        {
            _repository = repository;
            _mqtt = mqtt;
            _mapper = mapper;
        }

        public async Task<AlarmResponse> AddAlarm(AddAlarmModel alarmModel)
        {
            try
            {
                var entity = _mapper.Map<Alarms>(alarmModel);

                entity.IsActive = true;

                var response = _mapper.Map<AlarmResponse>(await _repository.AddAsync(entity));
                
                var payload = JsonConvert.SerializeObject(alarmModel);

                _mqtt.PublishMessageAsync("RuleEngine/AddAlarm", $"{payload}");

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error when adding alarm! See details : {ex.Message}");

                return null;
            }
        }

        public async Task<bool> DeleteAlarm(Guid id)
        {
            var response = false;

            try
            {
                response = await _repository.Delete(id);

                _mqtt.PublishMessageAsync("RuleEngine/AddAlarm", $"{id}");

                return response;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error when deleting alarm! See details : {ex.Message}");

                return response;
            }
        }

        public async Task<List<AlarmResponse>> GetAlarmsWithDeviceId(Guid id)
        {
            return _mapper.Map<List<AlarmResponse>>(await _repository.GetAlarmsByDeviceId(id));
        }

        public async Task<List<AlarmResponse>> GetAllActiveAlarms()
        {
            return _mapper.Map<List<AlarmResponse>>(await _repository.GetAllActiveAlarms());
        }

        public async Task<List<AlarmResponse>> GetAllAlarm()
        {
            return _mapper.Map<List<AlarmResponse>>(await _repository.GetAllAsync());
        }

        public async Task<bool> ReSetExecuteAlarm(Guid id)
        {
            var alarm = await _repository.GetById(id);

            if(alarm != null)
            {
                if (!alarm.IsAck) return true;

                alarm.IsAck = false;

                var response = await UpdateAlarm(_mapper.Map<UpdateAlarmModel>(alarm));

                _mqtt.PublishMessageAsync("RuleEngine/ReSetAlarm", $"{response.Id}"); // RE tarafının takip etmemesi için mesaj gönderilir. RE dictionary içerisinden ilgili alarmı silmektedir.

                return true;
            }

            return false;
        }

        public async Task<bool> SetExecuteAlarm(Guid id)
        {
            var alarm = await _repository.GetById(id);

            if (alarm != null)
            {
                if (alarm.IsAck) return true;

                alarm.IsAck = true;

                var response = await UpdateAlarm(_mapper.Map<UpdateAlarmModel>(alarm));

                _mqtt.PublishMessageAsync("RuleEngine/SetAlarm", $"{response.Id}"); // RE tarafının set etmesi için gönderilir. RE dictionary içerisine ilgili alarmı eklemektedir.

                return true;
            }

            return false;
        }

        public async Task<AlarmResponse> UpdateAlarm(UpdateAlarmModel updateModel)
        {
            var entity = _mapper.Map<Alarms>(updateModel);

            return _mapper.Map<AlarmResponse>(await _repository.UpdateAsync(entity));
        }
    }
}