using System.ComponentModel.DataAnnotations.Schema;
using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Scripts : BaseEntity
    {
        public string Name { get; set; }
        public string Script { get; set; }

        [Column(TypeName = "timestamp without time zone")]
        public DateTime CreatedDate { get; set; }
        public bool IsRunning { get; set; }
    }
}