using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class DataInUses : BaseEntity
    {
        public Guid DataId { get; set; }
        public string DataType { get; set; }
        public string EntityName { get; set; }
        public Guid EntityId {  get; set; }
    }
}