using System;
using System.Collections.Generic;
using System.Text;

namespace DeviceApplication.Models
{
    public class AddPagDeviceModel
    {
        public string Name { get; set; }
        public string IpAddress { get; set; }
        public int Port { get; set; }
        public Guid DeviceId { get; set; }
        public Guid PagId { get; set; }
        public bool InMaintenance { get; set; }
        public int TimeOut { get; set; }
    }
}