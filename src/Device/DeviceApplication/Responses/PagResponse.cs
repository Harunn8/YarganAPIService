using YarganCore.Entities;

namespace DeviceApplication.Responses
{
    public class PagResponse
    {
        public Guid Id {  get; set; }
        public string Name { get; set; }
        public List<Guid> DeviceId { get; set; }
        public List<Devices>? Device {  get; set; }
    }
}