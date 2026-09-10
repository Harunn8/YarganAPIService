using DeviceApplication.Models;
using System;
using System.Collections.Generic;
using System.Text;
using YarganCore.Entities;

namespace DeviceApplication.Responses
{
    public class DeviceResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Guid PagId { get; set; }
        public Pags Pag {  get; set; }
        public CommunicationType CommunicationType { get; set; }
        public string CommunicationData { get; set; }
    }
}