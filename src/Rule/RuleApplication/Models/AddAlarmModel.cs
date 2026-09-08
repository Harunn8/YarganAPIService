namespace RuleApplication.Models
{
    public class AddAlarmModel
    {
        public string Name { get; set; }
        public Guid PagDeviceId { get; set; }
        public Guid ParameterId { get; set; }
        public string FirstThreshold { get; set; }
        public string? SecondThreshold { get; set; }
        public string? Content { get; set; }
        public string FirstCondition { get; set; }
        public string? SecondCondition { get; set; }
        public int Severity { get; set; }
        public bool IsActive { get; set; }
    }
}