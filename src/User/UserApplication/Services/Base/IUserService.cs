namespace UserApplication.Services.Base
{
    public interface IUserService
    {
        public Task<UserResponse> AddUser(AddUserModel users);
        public Task<List<UserResponse>> GetUsers();
        public Task<UserResponse> GetUserById(Guid id);
        pub
    }
}