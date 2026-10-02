using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class PagRepository : Repository<Pags>
    {
        private readonly YarganAppDbContext _dbContext;

        public PagRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Pags> GetPagByName(string name) => await _dbContext.Set<Pags>().Where(x => string.Equals(x.Name, name)).Include(x => x.Device).FirstOrDefaultAsync();

        public async Task<Pags> GetPagByDeviceId(Guid deviceId) => await _dbContext.Set<Pags>().Where(x => x.DeviceId.Contains(deviceId)).Include(x => x.Device).FirstOrDefaultAsync();
    }
}