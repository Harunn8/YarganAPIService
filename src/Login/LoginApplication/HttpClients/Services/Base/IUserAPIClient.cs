namespace LoginApplication.HttpClients.Services.Base
{
    public interface IUserAPIClient
    {
        Task<bool> Login(string username, string password);
    }
}