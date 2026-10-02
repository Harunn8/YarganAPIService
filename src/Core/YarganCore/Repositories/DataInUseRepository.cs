using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class DataInUseRepository : Repository<DataInUses>
    {
        private readonly YarganAppDbContext _dbContext;

        public DataInUseRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<DataInUses>> GetDataInUsesByDataId(Guid dataId) => await _dbContext.Set<DataInUses>().Where(x => x.DataId == dataId).AsNoTracking().ToListAsync();
        public async Task<bool> DeleteDataInUsesByDataId(Guid dataId)
        {
            var dataInUses = await GetDataInUsesByDataId(dataId);

            if (!dataInUses.Any()) return true;

            try
            {
                _dbContext.Set<DataInUses>().RemoveRange(dataInUses);

                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch(Exception ex)
            {
                Console.WriteLine($"Error when deleting Data In Use. See details -->  {ex.Message}");

                return false;
            }
        }
    }
}