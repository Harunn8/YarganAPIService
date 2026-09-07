using YarganCore.Entities;

namespace SatopsApplication.Models
{
    public class AddTleModel
    {
        public string Name {  get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Altitude { get; set; }
        public double MinElevation { get; set; }
        public List<TleData> TleData { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public int SetupInterval { get; set; }
    }
}