using System.ComponentModel.DataAnnotations.Schema;
using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class CronPolicies : BaseEntity
    {
        public string Name { get; set; }
        public string? CronFormat { get; set; }
        public bool ForOnce { get; set; }
        [Column(TypeName = "timestamp without time zone")]
        public DateTime StartAt { get; set; }
        [Column(TypeName = "timestamp without time zone")]
        public DateTime? EndAt { get; set; }
        public Guid PolicyScriptId { get; set; }
        [Column(TypeName = "timestamp without time zone")]
        public DateTime CreatedDate { get; set; }
        public bool IsRunning { get; set; }
        public Scripts PolicyScript { get; set; }
    }
}