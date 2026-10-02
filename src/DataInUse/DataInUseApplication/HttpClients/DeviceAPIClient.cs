using DataInUseApplication.HttpClients.Base;
using DataInUseApplication.HttpClients.Settings;

namespace DataInUseApplication.HttpClients
{
    public class DeviceAPIClient : IDeviceAPIClient
    {
        private readonly HttpClient _httpClient;
        private readonly DeviceAPIClientSettings _settings;

        public DeviceAPIClient(HttpClient httpClient, DeviceAPIClientSettings settings)
        {
            _httpClient = httpClient;
            _settings = settings;
        }

        public async Task<HttpResponseMessage> GetDeviceById(Guid id)
        {
            var response = await _httpClient.GetAsync($"{_settings.GetDeviceByIdUrl}/{id}");

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return null;

            return response;
        }
    }
}