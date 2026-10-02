using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class DeviceRepository : Repository<Devices>
    {
        private readonly YarganAppDbContext _dbContext;

        public DeviceRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Devices> GetDeviceWithRelationById(Guid id) => await _dbContext.Set<Devices>().Where(x => x.Id == id).AsNoTracking().Include(x => x.Pag).FirstOrDefaultAsync();

        public async Task<List<Devices>> GetSNMPDevices() => await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.SNMP).AsNoTracking().ToListAsync();

        public async Task<List<Devices>> GetTCPDevices() => await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.TCP).AsNoTracking().ToListAsync();

        public async Task<List<Devices>> GetUDPDevices() => await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.UDP).AsNoTracking().ToListAsync();

        public async Task<List<Devices>> GetPingDevices() => await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.Ping).AsNoTracking().ToListAsync();
    }
}