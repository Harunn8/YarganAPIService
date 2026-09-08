using System;
using System.Collections.Generic;
using System.Text;

namespace DeviceApplication.Models
{
    public class AddTCPDeviceModel
    {
        public string Name { get; set; }
        public Guid PagId { get; set; }
        public List<TcpCommunicationModel> Queries {  get; set; }
        public string? Version { get; set; }
        public string? VersionNote { get; set; }
    }

    public class TcpCommunicationModel : BaseQueryModel
    {
        public string Format { get; set; }
    }
}
