using YarganCore.Entities;

namespace SatopsApplication.Models
{
    public class UpdateSatelliteModel
    {
        public Guid Id {  get; set; }
        public bool IsTracked { get; set; }
        public PassStatus Status { get; set; }
        public Guid PolicyScriptId { get; set; }
        public bool IsImportant { get; set; }
    }
}