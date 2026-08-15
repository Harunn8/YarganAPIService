using Newtonsoft.Json;

namespace SatopsApplication.Responses
{
    public class ActiveTleResponses
    {
        public string SatelliteName { get; set; }
        public string Line1 { get; set; }
        public string Line2 { get; set; }
    }
    public class ResponseModel
    {
        [JsonProperty("@context")]
        public string Context { get; set; }

        [JsonProperty("@id")]
        public string Id { get; set; }

        [JsonProperty("@type")]
        public string Type { get; set; }

        [JsonProperty("satelliteId")]
        public int SatelliteId { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("line1")]
        public string Line1 { get; set; }

        [JsonProperty("line2")]
        public string Line2 { get; set; }
    }

    public class SearchResponseModel
    {
        [JsonProperty("totalItems")]
        public int TotalItems { get; set; }

        [JsonProperty("member")]
        public List<ResponseModel> Members { get; set; }
    }
}