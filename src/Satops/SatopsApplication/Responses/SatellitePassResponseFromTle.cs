namespace SatopsApplication.Responses
{
    public class SatellitePassResponseFromTle
    {
        public string Name { get; set; }
        public double Duration { get; set; }
        public DateTime AOS { get; set; }
        public DateTime LOS { get; set; }
    }
}