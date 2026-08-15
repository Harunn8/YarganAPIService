using YarganCore.Entities;

namespace SatopsApplication.Responses
{
    public class SatellitePassResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public double Duration { get; set; }
        public DateTime AOS { get; set; }
        public DateTime LOS { get; set; }
        public bool IsTracked {  get; set; }
        public PassStatus Status {  get; set; }
        public DateTime UpdateDate {  get; set; }
    }
}