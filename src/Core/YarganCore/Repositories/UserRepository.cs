using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class UserRepository : Repository<Users>
    {
        public UserRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
        }
    }
}