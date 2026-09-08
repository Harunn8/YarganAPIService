using RuleApplication.Models;
using RuleApplication.Responses;

namespace RuleApplication.Services.Base
{
    public interface IAlarmService
    {
        Task<AlarmResponse> AddAlarm(AddAlarmModel alarmModel);
        Task<List<AlarmResponse>> GetAllAlarm();
        Task<List<AlarmResponse>> GetAllActiveAlarms(); // RuleEngine kullanmaktadır.
        Task<AlarmResponse> UpdateAlarm(UpdateAlarmModel updateModel);
        Task<List<AlarmResponse>> GetAlarmsWithDeviceId(Guid id);
        Task<bool> DeleteAlarm(Guid id);
        Task<bool> SetExecuteAlarm(Guid id); // Ack bilgisini okundu olarak işaretler
        Task<bool> ReSetExecuteAlarm(Guid id); // Okundu bilgisini geri alır
    }
}