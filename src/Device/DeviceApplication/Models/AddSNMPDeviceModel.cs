namespace DeviceApplication.Models
{
    public class AddSNMPDeviceModel
    {
        public string Name { get; set; }
        public Guid PagId { get; set; }
        public SNMPVersion SNMPVersion { get; set; }
        public string ReadCommunity { get; set; }
        public string? WriteCommunity { get; set; }
        public string? VersionNote { get; set; }
        public string? Version {  get; set; }
        public List<BaseQueryModel> Queries { get; set; }
    }

    public enum SNMPVersion
    {
        V1 = 1,
        V2 = 2,
        V3 = 3
    }
}