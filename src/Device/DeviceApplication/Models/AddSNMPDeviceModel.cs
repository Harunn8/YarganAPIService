using System;
using System.Collections.Generic;
using System.Text;

namespace DeviceApplication.Models
{
    public class AddSNMPDeviceModel
    {
        public string Name { get; set; }
        public Guid PagId { get; set; }
        public List<SnmpCommunicationData> Queries { get; set; }
        public string? Version { get; set; }
        public string? VersionNote { get; set; }
    }

    public class SnmpCommunicationData : BaseQueryModel
    {
        public string Oid { get; set; }
    }

}