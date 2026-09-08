using YarganCore.Entities;

namespace DeviceApplication.Responses
{
    public class PagDeviceResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid DeviceId {  get; set; }
        public Devices Device {  get; set; }
        public Guid PagId { get; set; }
        public Pags Pag {  get; set; }
        public bool InMaitenance { get; set; }
        public string IpAddress { get; set; }
        public int Port { get; set; }
        public int Timeout { get; set; }
    }
}