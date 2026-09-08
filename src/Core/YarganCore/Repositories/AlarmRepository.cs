using Microsoft.EntityFrameworkCore;
using YarganCore.AppDbContext;
using YarganCore.Entities;

namespace YarganCore.Repositories
{
    public class AlarmRepository : Repository<Alarms>
    {
        private readonly YarganAppDbContext _dbContext;
        public AlarmRepository(YarganAppDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
        }

        // RuleEngine tarafından kullanılır.
        public async Task<List<Alarms>> GetAllActiveAlarms()
        {
            var response = await _dbContext.Set<Alarms>().Where(x => x.IsActive && !x.IsDeleted).AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<List<Alarms>> GetAlarmsBySeverity(int severity)
        {
            var response = await _dbContext.Set<Alarms>().Where(x => x.Severity == severity).AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<IEnumerable<Alarms>> GetAlarmsByDeviceId(Guid deviceId)
        {
            var response = await _dbContext.Set<Alarms>().Where(x => x.PagDeviceId == deviceId).ToListAsync();

            return response;
        }
    }
}