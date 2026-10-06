using LoginApplication.Models;

namespace LoginApplication.Services.Base
{
    public interface ILoginService
    {
        Task<string> Login(LoginModel model);
        Task<bool> Logout();
    }
}