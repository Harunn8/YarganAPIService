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

        public async Task<PagDevices> GetPagDeviceById(Guid id)
        {
            var response = await _dbContext.Set<PagDevices>().Where(x => x.Id == id).Include(x => x.Device).Include(x => x.Pag).FirstOrDefaultAsync();

            return response;
        }

        public async Task<PagDevices> GetPagDevicesByIpAddress(string ipAddress)
        {
            var response = await _dbContext.Set<PagDevices>().Where(x => string.Equals(x.IpAddress, ipAddress)).Include(x => x.Device).Include(x => x.Pag).FirstOrDefaultAsync();

            return response;
        }

        public async Task<List<PagDevices>> GetPagDevicesByDeviceId(Guid deviceId)
        {
            var response = await _dbContext.Set<PagDevices>().Where(x => x.DeviceId == deviceId).Include(x => x.Device).Include(x => x.Pag).ToListAsync();

            return response;
        }

        public async Task<List<PagDevices>> GetPagDevicesByPagId(Guid pagId)
        {
            var response = await _dbContext.Set<PagDevices>().Where(x => x.PagId == pagId).Include(x => x.Device).Include(x => x.Pag).ToListAsync();

            return response;
        }
    }
}