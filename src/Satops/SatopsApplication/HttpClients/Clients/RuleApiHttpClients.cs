using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using RuleApplication.Models;
using RuleApplication.Responses;
using SatopsApplication.HttpClients.Clients.Base;
using SatopsApplication.HttpClients.Settings;
using SatopsApplication.Responses;
using System.Net.Http.Json;

namespace SatopsApplication.HttpClients.Clients
{
    public class RuleApiHttpClients : IRuleApiHttpClients
    {
        private readonly HttpClient _client;
        private readonly HttpClientSettings _settings;

        public RuleApiHttpClients(IHttpClientFactory _clientFactory, IOptions<HttpClientSettings> settings)
        {
            _client = _clientFactory.CreateClient();

            _settings = settings.Value;
        }

        public async Task<CronPolicyResponse> AddCronPolicy(AddCronPolicyModel addModel)
        {
            var response = await _client.PostAsJsonAsync(_settings.AddCronPolicyUrl, addModel);

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return null;

            var cronPolicyResponse = JsonConvert.DeserializeObject<CronPolicyResponse>(await response.Content.ReadAsStringAsync());

            return cronPolicyResponse;
        }

        public async Task<PolicyScriptResponse> AddPolicyScript(AddScriptModel addModel)
        {
            var response = await _client.PostAsJsonAsync(_settings.AddPolicyScriptUrl, addModel);

            var policyScriptResponse = JsonConvert.DeserializeObject<PolicyScriptResponse>(await response.Content.ReadAsStringAsync());

            return policyScriptResponse;
        }

        public async Task<bool> DeletePolicyScript(Guid id)
        {
            var response = await _client.DeleteAsync($"{_settings.DeletePolicyScriptUrl}/{id}");

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return false;

            return true;
        }

        public async Task<List<ActiveTleResponses>> GetActiveTleResponse(string satelliteName)
        {
            List<ActiveTleResponses> tleResponses = new List<ActiveTleResponses>();

            var response = await _client.GetAsync($"{_settings.GetActiveTleUrl}{satelliteName}");

            if (response.StatusCode != System.Net.HttpStatusCode.OK) return null;

            var tleData = JsonConvert.DeserializeObject<SearchResponseModel>(await response.Content.ReadAsStringAsync());

            if (tleData == null || tleData.Members.Count == 0) return null;

            foreach(var item in  tleData.Members)
            {
                var model = new ActiveTleResponses
                {
                    SatelliteName = item.Name,
                    Line1 = item.Line1,
                    Line2 = item.Line2,
                };

                tleResponses.Add(model);
            }

            return tleResponses;
        }

        public async Task<PolicyScriptResponse> GetPolicyScript(Guid id)
        {
            var response = await _client.GetAsync($"{_settings.GetPolicyScriptUrl}/{id}");

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return null;

            return JsonConvert.DeserializeObject<PolicyScriptResponse>(await response.Content.ReadAsStringAsync());
        }

        public async Task<bool> StartCronPolicy(Guid id, bool status = true)
        {
            // Rule API rotası: PUT api/CronPolicy/startorstop/{id},{isStart}
            var response = await _client.PutAsync($"{_settings.StartCronPolicyScriptUrl}/{id},{status}", null);

            if (response?.StatusCode != System.Net.HttpStatusCode.OK) return false;

            return JsonConvert.DeserializeObject<bool>(await response.Content.ReadAsStringAsync());
        }
    }
}