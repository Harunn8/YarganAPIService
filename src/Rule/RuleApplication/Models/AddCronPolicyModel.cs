namespace RuleApplication.Models
{
    public class AddCronPolicyModel
    {
        public string Name { get; set; }
        public string CronFormat { get; set; }
        public bool ForOnce { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public Guid PolicyScriptId { get; set; }
    }
}