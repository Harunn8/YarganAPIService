using AutoMapper;
using Helpers.TokenInformation;
using Helpers.UserLogService.Model;
using Helpers.UserLogService.Service.Base;
using System.Security.Cryptography;
using System.Text;
using UserApplication.Models;
using UserApplication.Responses;
using UserApplication.Services.Base;
using YarganCore.Entities;
using YarganCore.Repositories;

namespace UserApplication.Services
{
    public class UserService : IUserService
    {
        private readonly UserRepository _repository;
        private readonly IMapper _mapper;
        private readonly IUserLogService _userLogService;
        private readonly ITokenInformationService _tokenInformation;

        public UserService(UserRepository repository, IMapper mapper, IUserLogService userLogService, ITokenInformationService tokenInformation)
        {
            _repository = repository;
            _mapper = mapper;
            _userLogService = userLogService;
            _tokenInformation = tokenInformation;
        }

        public async Task<UserResponse> AddUser(AddUserModel addModel)
        {
            var entity = _mapper.Map<Users>(addModel);

            entity.Password = HashPassword(entity.Password);

            var response = await _repository.AddAsync(entity);

            #region UserLog

            var logModel = new UserLogs
            {
                Description = $"User {entity.UserName} added.",
                MethodName = nameof(AddUser),
                AppName = nameof(UserService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Add
            };

            await _userLogService.SetEventLog(logModel);

            #endregion

            return _mapper.Map<UserResponse>(response);
        }

        public async Task<bool> DeleteUser(Guid id) => await _repository.Delete(id);

        public async Task<IEnumerable<UserResponse>> GetAllUser() => _mapper.Map<IEnumerable<UserResponse>>(await _repository.GetAllAsync());

        public async Task<UserResponse> GetUserByEmail(string email) => _mapper.Map<UserResponse>((await _repository.GetQueryable(x => x.Email.Equals(email))).FirstOrDefault());

        public async Task<UserResponse> GetUserById(Guid id) => _mapper.Map<UserResponse>(await _repository.GetById(id));

        public async Task<IEnumerable<UserResponse>> GetUserByRoleId(Guid roleId) => _mapper.Map<IEnumerable<UserResponse>>(await _repository.GetQueryable(x => x.RoleId.Equals(roleId)));

        public async Task<UserResponse> GetUserByUserName(string userName) => _mapper.Map<UserResponse>((await _repository.GetQueryable(x => x.UserName.Equals(userName))).FirstOrDefault());

        public async Task<bool> Login(string userName, string password)
        {
            // Token LoginAPI tarafında oluşturulacak.

            var user = await GetUserByUserName(userName);

            if (user == null) return false;

            if (user.Password.Equals(HashPassword(password)))
            {
                #region UserLog

                var logModel = new UserLogs
                {
                    Description = $"User {user.UserName} logged in.",
                    MethodName = nameof(Login),
                    AppName = nameof(UserService),
                    TimeStamp = DateTime.Now,
                    UserName = _tokenInformation.GetUserName(),
                    LogType = LogType.Login
                };

                await _userLogService.SetEventLog(logModel);

                #endregion

                return true;
            }

            return false;
        }

        public Task<bool> LogOut()
        {
            // Stateless bir uygulamada logout işlemi için token blacklist yapılabilir.

            throw new NotImplementedException();
        }

        public async Task<UserResponse> UpdateUser(UpdateUserModel updateModel)
        {
            var entity = _mapper.Map<Users>(updateModel);

            var response = await _repository.UpdateAsync(entity);

            #region UserLog

            var logModel = new UserLogs
            {
                Description = $"User {entity.UserName} added.",
                MethodName = nameof(UpdateUser),
                AppName = nameof(UserService),
                TimeStamp = DateTime.Now,
                UserName = _tokenInformation.GetUserName(),
                LogType = LogType.Add
            };

            await _userLogService.SetEventLog(logModel);

            #endregion

            return _mapper.Map<UserResponse>(response);
        }

        private string HashPassword(string password)
        {
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(password));

            return Convert.ToBase64String(hash);
        }
    }
}