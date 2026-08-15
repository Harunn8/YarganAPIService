using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class SatellitePassesRepository : Repository<SatellitePasses>
    {
        private readonly YarganAppDbContext _dbContext;

        public SatellitePassesRepository(AppDbContext.YarganAppDbContext dbContext) : base(dbContext) 
        {
            _dbContext = dbContext;
        }

        public async Task<List<SatellitePasses>> AddPasses(List<SatellitePasses> passes)
        {
            var response = _dbContext.Set<SatellitePasses>().AddRangeAsync(passes);

            await _dbContext.SaveChangesAsync();

            return passes;
        }
    }
}