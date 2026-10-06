using UserApplication.Models;
using UserApplication.Responses;

namespace UserApplication.Services.Base
{
    public interface IUserService
    {
        Task<UserResponse> AddUser(AddUserModel addModel);
        Task<UserResponse> UpdateUser(UpdateUserModel updateModel);
        Task<IEnumerable<UserResponse>> GetAllUser();
        Task<UserResponse> GetUserById(Guid id);
        Task<IEnumerable<UserResponse>> GetUserByRoleId(Guid roleId);
        Task<UserResponse> GetUserByUserName(string userName);
        Task<UserResponse> GetUserByEmail(string email);
        Task<bool> Login(string userName, string password);
        Task<bool> LogOut();
        Task<bool> DeleteUser(Guid id);
    }
}