namespace SatopsApplication.Models
{
    public class AddSatelliteModel
    {
        public string Name { get; set; }
        public double Duration { get; set; }
        public DateTime AOS { get; set; }
        public DateTime LOS { get; set; }
        public double MaxElevation { get; set; }
        public bool IsImportant { get; set; }
    }
}