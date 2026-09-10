using AutoMapper;
using DeviceApplication.Models;
using DeviceApplication.Responses;
using DeviceApplication.Services.Base;
using Helpers.UserLogService.Model;
using Helpers.UserLogService.Service.Base;
using YarganCore.Entities;
using YarganCore.Repositories;

namespace DeviceApplication.Services
{
    public class PagService : IPagService
    {
        private readonly PagRepository _repository;
        private readonly IUserLogService _userLog;
        private readonly IMapper _mapper;

        public PagService(PagRepository repository, IUserLogService userLog, IMapper mapper)
        {
            _repository = repository;
            _userLog = userLog;
            _mapper = mapper;
        }

        public async Task<PagResponse> AddPag(AddPagModel addModel)
        {
            var entity = _mapper.Map<Pags>(addModel);

            if (entity.DeviceId == null) entity.DeviceId = new List<Guid>();  

            var response = await _repository.AddAsync(entity);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{response.Name} created",
                MethodName = nameof(AddPag),
                AppName = nameof(PagService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Add
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<PagResponse>(response);
        }

        public async Task<bool> DeletePag(Guid id)
        {
            var entity = await _repository.GetById(id);

            var response = await _repository.Delete(id);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{entity.Name} deleted",
                MethodName = nameof(DeletePag),
                AppName = nameof(PagService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Delete
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return response ? true : false;
        }

        public async Task<List<PagResponse>> GetAllPags()
        {
            return _mapper.Map<List<PagResponse>>(await _repository.GetAllAsync());
        }

        public async Task<PagResponse> GetPagWithDeviceId(Guid deviceId)
        {
            return _mapper.Map<PagResponse>(await _repository.GetPagByDeviceId(deviceId));
        }

        public async Task<PagResponse> UpdatePag(UpdatePagModel updateModel)
        {
            var entity = _mapper.Map<Pags>(updateModel);

            #region Userlog
            var logModel = new UserLogs
            {
                Description = $"{entity.Name} updated",
                MethodName = nameof(UpdatePag),
                AppName = nameof(PagService),
                TimeStamp = DateTime.Now,
                UserName = "Administrator",
                LogType = LogType.Update
            };

            await _userLog.SetEventLog(logModel);

            #endregion

            return _mapper.Map<PagResponse>(await _repository.UpdateAsync(entity));
        }
    }
}