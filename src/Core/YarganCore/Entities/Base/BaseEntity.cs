using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace YarganCore.Entities.Base
{
    public class BaseEntity
    {
        public Guid Id { get; set; } = new Guid();

        [Column(TypeName = "timestamp without time zone")]
        public DateTime UpdateDate {  get; set; } = DateTime.Now;
        public bool IsDeleted { get; set; }
    }
}