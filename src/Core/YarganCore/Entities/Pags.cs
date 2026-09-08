using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Pags : BaseEntity
    {
        public string Name { get; set; }
        public Guid DeviceId { get; set; }
        public Devices Device {  get; set; }
    }
}