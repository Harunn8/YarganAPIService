using AutoMapper;
using DeviceApplication.Models;
using DeviceApplication.Responses;
using DeviceApplication.Services.Base;
using Helpers.UserLogService.Model;
using Helpers.UserLogService.Service.Base;
using Newtonsoft.Json;
using YarganCore.Entities;
using YarganCore.Repositories;

namespace DeviceApplication.Services
{
    public class DeviceService : IDeviceService
    {
        private readonly DeviceRepository _repository;
        private readonly IMapper _mapper;
        private readonly IUserLogService _userLog;

        public DeviceService(DeviceRepository repository, IMapper mapper, IUserLogService userLog)
        {
            _repository = repository;
            _mapper = mapper;
            _userLog = userLog;
        }

        public async Task<DeviceResponse> AddSNMPDevice(AddSNMPDeviceModel addSnmpModel)
        {
            Devices entity = new Devices
            {
                Name = addSnmpModel.Name,
                PagId = addSnmpModel.PagId,
                CommunicationData = JsonConvert.SerializeObject(addSnmpModel.Queries),
                CommunicationType = CommunicationType.SNMP,
                Version = addSnmpModel.Version,
                VersionNote = addSnmpModel.VersionNote
            };

            var response = await _repository.AddAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(AddSNMPDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Add
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<DeviceResponse>(response);
        }

        public async Task<DeviceResponse> AddTCPDevice(AddTCPDeviceModel addTcpModel)
        {
            Devices entity = new Devices
            {
                Name = addTcpModel.Name,
                PagId = addTcpModel.PagId,
                CommunicationData = JsonConvert.SerializeObject(addTcpModel.Queries),
                CommunicationType = CommunicationType.TCP,
                Version = addTcpModel.Version,
                VersionNote = addTcpModel.VersionNote
            };

            var response = await _repository.AddAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(AddTCPDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Add
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<DeviceResponse>(response);
        }

        public async Task<bool> DeleteDevice(Guid id)
        {
            var device = await GetDeviceById(id);

            var response = await _repository.Delete(id);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{device.Name} created",
                MethodName = nameof(DeleteDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Delete
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return response ? true : false;
        }

        public async Task<List<DeviceResponse>> GetAllDevice()
        {
            var response = await _repository.GetAllAsync();

            return _mapper.Map<List<DeviceResponse>>(response);
        }

        public async Task<DeviceResponse> GetDeviceById(Guid id)
        {
            var response = await _repository.GetById(id);

            return _mapper.Map<DeviceResponse>(response);
        }

        public async Task<List<DeviceResponse>> GetDevicesByPagId(Guid pagId)
        {
            var response = (await _repository.GetQueryable(x => x.PagId == pagId)).ToList();

            return _mapper.Map<List<DeviceResponse>>(response);
        }

        public async Task<List<DeviceResponse>> GetSNMPDevices()
        {
            var response = await _repository.GetSNMPDevices();

            return _mapper.Map<List<DeviceResponse>>(response);
        }

        public async Task<List<DeviceResponse>> GetTCPDevices()
        {
            var response = await _repository.GetTCPDevices();

            return _mapper.Map<List<DeviceResponse>>(response);
        }

        public async Task<DeviceResponse> UpdateDevice(UpdateDeviceModel updateModel)
        {
            var entity = _mapper.Map<Devices>(updateModel);

            var response = await _repository.UpdateAsync(entity);

            return _mapper.Map<DeviceResponse>(response);
        }
    }
}