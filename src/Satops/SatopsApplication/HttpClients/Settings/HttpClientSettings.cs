namespace SatopsApplication.HttpClients.Settings
{
    public class HttpClientSettings
    {
        public string AddPolicyScriptUrl { get; set; }
        public string StartCronPolicyScriptUrl { get; set; }
        public string GetPolicyScriptUrl { get; set; }
        public string AddCronPolicyUrl { get; set; }
        public string GetActiveTleUrl { get; set; }
        public string DeletePolicyScriptUrl { get; set; }
    }
}