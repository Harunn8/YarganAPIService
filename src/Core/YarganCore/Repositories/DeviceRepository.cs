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

        public async Task<Devices> GetDeviceWithRelationById(Guid id)
        {
            var response = await _dbContext.Set<Devices>().Where(x => x.Id == id).AsNoTracking().Include(x => x.Pag).FirstOrDefaultAsync();

            return response;
        }

        public async Task<List<Devices>> GetSNMPDevices()
        {
            var response = await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.SNMP).AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<List<Devices>> GetTCPDevices()
        {
            var response = await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.TCP).AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<List<Devices>> GetUDPDevices()
        {
            var response = await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.UDP).AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<List<Devices>> GetPingDevices()
        {
            var response = await _dbContext.Set<Devices>().Where(x => x.CommunicationType == CommunicationType.Ping).AsNoTracking().ToListAsync();

            return response;
        }
    }
}