using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class CronPolicyRepository : Repository<CronPolicies>
    {
        private readonly YarganAppDbContext _dbContext;
        public CronPolicyRepository(YarganAppDbContext dbContext) : base(dbContext) { _dbContext = dbContext; }

        public async Task<List<CronPolicies>> GetActiveJobs() => await _dbContext.Set<CronPolicies>().Where(x => x.Id != Guid.Empty && x.PolicyScript != null && !x.IsDeleted && x.IsRunning).Include(x => x.PolicyScript).AsNoTracking().ToListAsync();
        
        public async Task<CronPolicies> GetCronJobById(Guid id) => await _dbContext.Set<CronPolicies>().Where(x => x.Id == id).Include(x => x.PolicyScript).FirstOrDefaultAsync();
    }
}