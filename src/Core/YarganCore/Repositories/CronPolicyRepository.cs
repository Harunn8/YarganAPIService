using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class CronPolicyRepository : Repository<CronPolicies>
    {
        public CronPolicyRepository(YarganAppDbContext dbContext) : base(dbContext) { }      
    }
}