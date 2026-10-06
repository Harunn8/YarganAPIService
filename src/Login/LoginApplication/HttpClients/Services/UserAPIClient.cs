using LoginApplication.HttpClients.Services.Base;
using LoginApplication.HttpClients.Settings;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;

namespace LoginApplication.HttpClients.Services
{
    public class UserAPIClient : IUserAPIClient
    {
        private readonly HttpClient _httpClient;
        private readonly UserAPIClientSettings _settings;

        public UserAPIClient(HttpClient httpClient, IOptions<UserAPIClientSettings> settings)
        {
            _httpClient = httpClient;
            _settings = settings.Value;
        }

        public async Task<bool> Login(string username, string password)
        {
            var request = new { userName = username, password = password }; 

            var response = await _httpClient.PostAsJsonAsync(_settings.LoginUrl,request);

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return false;

            return true;
        }
    }
}