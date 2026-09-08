using YarganCore.Entities;

namespace DeviceApplication.Responses
{
    public class PagResponse
    {
        public Guid Id {  get; set; }
        public string Name { get; set; }
        public Guid DeviceId { get; set; }
        public Devices Device {  get; set; }
    }
}