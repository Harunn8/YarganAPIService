namespace RuleApplication.Responses
{
    public class CronPolicyResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string CronFormat { get; set; }
        public bool ForOnce { get; set; }
        public Guid PolicyScriptId { get; set; }
        public DateTime UpdateDate { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsRunning { get; set; }
    }
}