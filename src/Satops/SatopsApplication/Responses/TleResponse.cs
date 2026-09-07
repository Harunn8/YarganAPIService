using YarganCore.Entities;

namespace SatopsApplication.Responses
{
    public class TleResponse
    {
        public Guid Id {  get; set; }
        public string Name { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Altitude { get; set; }
        public double MinElevation { get; set; }
        public List<TleData> TleData { get; set; }
        public int SetupInterval { get; set; }
    }
}