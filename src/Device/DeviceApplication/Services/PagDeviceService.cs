using AutoMapper;
using DeviceApplication.Models;
using DeviceApplication.Responses;
using DeviceApplication.Services.Base;
using EventBusBrokers.Services.Base;
using Helpers.UserLogService.Model;
using Helpers.UserLogService.Service.Base;
using Newtonsoft.Json;
using YarganCore.Entities;
using YarganCore.Repositories;

namespace DeviceApplication.Services
{
    public class PagDeviceService : IPagDeviceService
    {
        private readonly PagDeviceRepository _repository;
        private readonly IMqttConnection _mqtt;
        private readonly IMapper _mapper;
        private readonly IUserLogService _userLog;

        public PagDeviceService(PagDeviceRepository repository, IMqttConnection mqtt, IMapper mapper, IUserLogService userLog)
        {
            _repository = repository;
            _mqtt = mqtt;
            _mapper = mapper;
            _userLog = userLog;
        }

        public async Task<PagDeviceResponse> AddPagDevice(AddPagDeviceModel addModel)
        {
            var entity = _mapper.Map<PagDevices>(addModel);

            var response = await _repository.AddAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(AddPagDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Add
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            var pagDeviceResponse = await _repository.GetPagDeviceById(response.Id);

            return _mapper.Map<PagDeviceResponse>(pagDeviceResponse);
        }

        public async Task<bool> DeletePagDevice(Guid id)
        {
            var pagDevice = await _repository.GetById(id);
            
            var response = await _repository.Delete(id);

            _mqtt.PublishMessageAsync("DCM/DeleteDevice", $"{JsonConvert.SerializeObject(_mapper.Map<PagDeviceResponse>(pagDevice))}");

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{pagDevice.Name} deleted",
                MethodName = nameof(DeletePagDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Delete
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return response ? true : false;
        }

        // DCM ilk ayağa kalktığında bu endpoint'i kullanacaktır.
        public async Task<List<PagDeviceResponse>> GetActivePagDevices()
        {
            var pagDevices = (await _repository.GetQueryable(x => x.Id != Guid.Empty && !x.InMaintenance && !x.IsDeleted)).ToList();

            return _mapper.Map<List<PagDeviceResponse>>(pagDevices);
        }

        public async Task<List<PagDeviceResponse>> GetAllPagDevice()
        {
            return _mapper.Map<List<PagDeviceResponse>>(await _repository.GetAllAsync());
        }

        public async Task<PagDeviceResponse> GetPagDeviceById(Guid id)
        {
            return _mapper.Map<PagDeviceResponse>(await _repository.GetById(id));
        }

        public async Task<PagDeviceResponse> GetPagDeviceByName(string name)
        {
            return _mapper.Map<PagDeviceResponse>((await _repository.GetQueryable(x => x.Name == name)).FirstOrDefault());
        }

        public async Task<List<PagDeviceResponse>> GetPagDevicesByDeviceId(Guid deviceId)
        {
            return _mapper.Map<List<PagDeviceResponse>>(await _repository.GetPagDevicesByDeviceId(deviceId));
        }

        public async Task<List<PagDeviceResponse>> GetPagDevicesByPagId(Guid pagId)
        {
            return _mapper.Map<List<PagDeviceResponse>>(await _repository.GetPagDevicesByPagId(pagId));
        }

        public async Task<bool> StartOrStopCommunication(Guid id, bool isStart)
        {
            var pagDevice = (await _repository.GetQueryable(x => x.Id == id && x.InMaintenance != isStart)).FirstOrDefault();

            var payload = new object();

            if (pagDevice != null)
            {
                pagDevice.InMaintenance = isStart;

                pagDevice.UpdateDate = DateTime.Now;

                await _repository.UpdateAsync(pagDevice);

                payload = JsonConvert.SerializeObject(pagDevice);

                _mqtt.PublishMessageAsync("DCM/StartOrStopCommunication", $"{payload}");

                var status = isStart ? "Started" : "Stopped";

                #region Userlog
                var logModel = new UserLogs
                {
                    Description = $"{pagDevice.Name} communication {status}",
                    MethodName = nameof(StartOrStopCommunication),
                    AppName = nameof(DeviceService),
                    TimeStamp = DateTime.Now,
                    UserName = "Administrator",
                    LogType = LogType.StartOrStopCommunication
                };

                await _userLog.SetEventLog(logModel);

                #endregion

                return true;
            }

            return false;
        }

        public async Task<bool> StartOrStopMultiDevice(List<Guid> pagDeviceIds, bool isStart)
        {
            foreach (var pagDeviceId in pagDeviceIds) await StartOrStopCommunication(pagDeviceId, isStart);

            return true;
        }

        public async Task<PagDeviceResponse> UpdatePagDevice(UpdatePagDeviceModel model)
        {
            var entity = _mapper.Map<PagDevices>(model);

            var response = _mapper.Map<PagDeviceResponse>(await _repository.UpdateAsync(entity));

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} updated",
                MethodName = nameof(UpdatePagDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Update
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return response;
        }
    }
}