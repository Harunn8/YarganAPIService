using System.ComponentModel.DataAnnotations.Schema;
using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class SatellitePasses : BaseEntity
    {
        public string Name { get; set; }
        public double Duration { get; set; }

        [Column(TypeName = "timestamp without time zone")]
        public DateTime AOS {  get; set; }

        [Column(TypeName = "timestamp without time zone")]
        public DateTime LOS { get; set; }
        public double MaxElevation { get; set; }
        public bool IsTracked { get; set; }
        public PassStatus Status { get; set; }
        public Guid PolicyScriptId {  get; set; }
        public bool IsImportent { get; set; }
    }

    public enum PassStatus
    {
        SelectTracking,
        Queued,
        Tracking,
        Completed,
        Failed,
        Canceled,
        Skipped
    }
}