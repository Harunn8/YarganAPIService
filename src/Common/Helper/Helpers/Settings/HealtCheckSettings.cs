namespace Helpers.Settings
{
    public class HealtCheckSettings
    {
        public HealthEndPoint EndPoint {  get; set; }
        public int IntervalSeconds { get; set; }
    }

    public class HealthEndPoint
    {
        public string Name { get; set; }
        public string Uri { get; set; }
    }
}