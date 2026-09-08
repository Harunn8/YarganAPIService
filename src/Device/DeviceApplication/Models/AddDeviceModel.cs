using YarganCore.Entities;

namespace DeviceApplication.Models
{
    public class AddDeviceModel
    {
        public string Name { get; set; }
        public Guid PagId { get; set; }
        public CommunicationType CommunicationType { get; set; }
        public string? Version { get; set; }
        public string? VersionNote { get; set; }
        public string CommunicationData { get; set; }
    }
}