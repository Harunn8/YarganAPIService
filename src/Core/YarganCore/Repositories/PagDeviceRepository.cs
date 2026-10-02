using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class PagDeviceRepository : Repository<PagDevices>
    {
        private readonly YarganAppDbContext _dbContext;
        public PagDeviceRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<PagDevices> GetPagDeviceById(Guid id) => await _dbContext.Set<PagDevices>().Where(x => x.Id == id).Include(x => x.Device).Include(x => x.Pag).FirstOrDefaultAsync();

        public async Task<PagDevices> GetPagDevicesByIpAddress(string ipAddress) => await _dbContext.Set<PagDevices>().Where(x => string.Equals(x.IpAddress, ipAddress)).Include(x => x.Device).Include(x => x.Pag).FirstOrDefaultAsync();

        public async Task<List<PagDevices>> GetPagDevicesByDeviceId(Guid deviceId) => await _dbContext.Set<PagDevices>().Where(x => x.DeviceId == deviceId).Include(x => x.Device).Include(x => x.Pag).ToListAsync();

        public async Task<List<PagDevices>> GetPagDevicesByPagId(Guid pagId) => await _dbContext.Set<PagDevices>().Where(x => x.PagId == pagId).Include(x => x.Device).Include(x => x.Pag).ToListAsync();
    }
}