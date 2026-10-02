using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class TleRepository : Repository<Tle>
    {
        private readonly YarganAppDbContext _dbContext;
        public TleRepository(YarganAppDbContext dbContext) : base(dbContext) { _dbContext = dbContext; }
        
        public async Task<Tle> GetTleByDefault() => await _dbContext.Set<Tle>().FirstOrDefaultAsync();
    }
}