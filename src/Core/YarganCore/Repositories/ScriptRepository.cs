using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class ScriptRepository : Repository<Scripts>
    {
        public ScriptRepository(YarganAppDbContext dbContext) : base(dbContext) { }

    }
}