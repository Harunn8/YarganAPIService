using AutoMapper;
using DeviceApplication.Models;
using DeviceApplication.Responses;
using DeviceApplication.Services.Base;
using Helpers.TokenInformation;
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
        private readonly ITokenInformationService _tokenInformation;

        public DeviceService(DeviceRepository repository, IMapper mapper, IUserLogService userLog, ITokenInformationService tokenInformation)
        {
            _repository = repository;
            _mapper = mapper;
            _userLog = userLog;
            _tokenInformation = tokenInformation;
        }

        public async Task<DeviceResponse> AddSNMPDevice(AddSNMPDeviceModel addSnmpModel)
        {
            Devices entity = new Devices
            {
                Name = addSnmpModel.Name,
                PagId = addSnmpModel.PagId,
                CommunicationData = JsonConvert.SerializeObject(addSnmpModel),
                CommunicationType = CommunicationType.SNMP,
                Version = addSnmpModel.Version,
                VersionNote = addSnmpModel.VersionNote,
            };

            var response = await _repository.AddAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(AddSNMPDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Add
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            var responseWithRelation = await _repository.GetDeviceWithRelationById(response.Id);

            return _mapper.Map<DeviceResponse>(responseWithRelation);
        }

        public async Task<DeviceResponse> AddTCPDevice(AddTCPDeviceModel addTcpModel)
        {
            Devices entity = new Devices
            {
                Name = addTcpModel.Name,
                PagId = addTcpModel.PagId,
                CommunicationData = JsonConvert.SerializeObject(addTcpModel),
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
                UserName = _tokenInformation.GetUserName(),
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
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Delete
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return response ? true : false;
        }

        public async Task<List<DeviceResponse>> GetAllDevice() => _mapper.Map<List<DeviceResponse>>(await _repository.GetAllAsync());

        public async Task<DeviceResponse> GetDeviceById(Guid id) => _mapper.Map<DeviceResponse>(await _repository.GetById(id));

        public async Task<List<DeviceResponse>> GetDevicesByPagId(Guid pagId) => _mapper.Map<List<DeviceResponse>>(await _repository.GetQueryable(x => x.PagId == pagId)).ToList();

        public async Task<List<DeviceResponse>> GetSNMPDevices() => _mapper.Map<List<DeviceResponse>>(await _repository.GetSNMPDevices());

        public async Task<List<DeviceResponse>> GetTCPDevices() => _mapper.Map<List<DeviceResponse>>(await _repository.GetTCPDevices());

        public async Task<DeviceResponse> UpdateDevice(UpdateDeviceModel updateModel)
        {
            var entity = _mapper.Map<Devices>(updateModel);

            var response = await _repository.UpdateAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(UpdateDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Update
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<DeviceResponse>(response);
        }

        public async Task<DeviceResponse> UpdateSNMPDevice(UpdateSNMPDeviceModel updateSnmpDeviceModel)
        {
            var entity = _mapper.Map<Devices>(updateSnmpDeviceModel);

            var response = await _repository.UpdateAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(UpdateSNMPDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Update
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<DeviceResponse>(response);
        }

        public async Task<DeviceResponse> UpdateTCPDevice(UpdateTCPModel updateTcpDeviceModel)
        {
            var entity = _mapper.Map<Devices>(updateTcpDeviceModel);

            var response = await _repository.UpdateAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(UpdateTCPDevice),
                AppName = nameof(DeviceService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Update
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<DeviceResponse>(response);
        }
    }
}