using System;
using System.Collections.Generic;
using System.Text;

namespace DeviceApplication.Models
{
    public class BaseQueryModel
    {
        public Guid ParameterId { get; set; } = Guid.NewGuid();
    }

    //public class AlarmInfo
    //{
    //    public Guid ParameterId { get; set; }
    //    public string FirstThreshold { get; set; }
    //    public string FirstCondition { get; set; }
    //    public string? SecondThreshold { get; set; }
    //    public string? SecondCondition { get; set; }
    //}
}
