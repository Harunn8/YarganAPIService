using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;
using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Tle : BaseEntity
    {
        public string Name { get; set; }
        public List<TleData> TleData { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double Altitude { get; set; }
        public double MinElevation { get; set; }

        [Column(TypeName = "timestamp without time zone")]
        public DateTime StartAt { get; set; }

        [Column(TypeName = "timestamp without time zone")]
        public DateTime EndAt { get; set; }
        public int SetupInterval { get; set; }
    }

    public class TleData
    {
        public string SatelliteName { get; set; }
        public string Line1 { get; set; }
        public string Line2 { get; set; }
    }
}