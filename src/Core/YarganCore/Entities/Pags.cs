using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Pags : BaseEntity
    {
        public string Name { get; set; }
        public List<Guid> DeviceId { get; set; }
        public List<Devices> Device {  get; set; }
    }
}