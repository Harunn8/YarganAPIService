using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Devices : BaseEntity
    {
        public string Name { get; set; }
        public string CommunicationData { get; set; }
        public CommunicationType CommunicationType { get; set; }
        public string? Version { get; set; }
        public string? VersionNote { get; set; }
        public Guid PagId { get; set; }
        public Pags Pag {  get; set; }
        public IEnumerable<DataInUses> DataInUses { get; set; }
    }

    public enum CommunicationType
    {
        SNMP,
        TCP,
        UDP,
        Ping
    }
}