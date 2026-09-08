using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class PagDevices : BaseEntity
    {
        public string Name { get; set; }
        public Guid DeviceId {  get; set; }
        public Devices Device {  get; set; }
        public Guid PagId { get; set; }
        public Pags Pag { get; set; }
        public string IpAddress { get; set; }
        public int Port { get; set; }
        public int Timeout { get; set; }
        public bool InMaintenance { get; set; }
    }
}