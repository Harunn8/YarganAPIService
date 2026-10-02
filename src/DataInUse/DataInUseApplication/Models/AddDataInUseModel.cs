namespace DataInUseApplication.Models
{
    public class AddDataInUseModel
    {
        public string DataType { get; set; }
        public string EntityName { get; set; }
        public Guid EntityId {  get; set; }
        public Guid DataId { get; set; }
    }
}