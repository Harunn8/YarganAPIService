namespace DataInUseApplication.Models
{
    public class UpdateDataInUseModel
    {
        public Guid Id {  get; set; }
        public Guid EntityId {  get; set; }
        public Guid DataId {  get; set; }
        public string DataType { get; set; }
        public string EntityName { get; set; }
    }
}