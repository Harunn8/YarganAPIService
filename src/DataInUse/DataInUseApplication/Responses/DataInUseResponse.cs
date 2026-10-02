using System;
using System.Collections.Generic;
using System.Text;

namespace DataInUseApplication.Responses
{
    public class DataInUseResponse
    {
        public Guid Id {  get; set; }
        public Guid EntityId { get; set; }
        public string EntityName { get; set; }
        public string DataType { get; set; }
        public Guid DataId { get; set; }
    }
}
