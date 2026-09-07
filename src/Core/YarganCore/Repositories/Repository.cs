using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using YarganCore.AppDbContext;
using YarganCore.Entities.Base;
using YarganCore.Repositories.Base;

namespace YarganCore.Repositories
{
    public class Repository<T> : IRepository<T> where T : BaseEntity
    {
        private readonly YarganAppDbContext _dbContext;

        public Repository(YarganAppDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<T> AddAsync(T entity)
        {
            var response = await _dbContext.Set<T>().AddAsync(entity);

            await _dbContext.SaveChangesAsync();

            return response.Entity;
        }

        public async Task<bool> Delete(Guid id)
        {
            var entity = await GetById(id);

            if (entity == null) return false;

            var response = _dbContext.Set<T>().Remove(entity);

            return response.State == Microsoft.EntityFrameworkCore.EntityState.Deleted ? true : false;
        }

        public async Task<bool> DeleteAll()
        {
            try
            {
                var entities = _dbContext.Set<T>().ToList();

                if (entities.Count == 0) return false;

                _dbContext.Set<T>().RemoveRange(entities);

                await _dbContext.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error when deleting entities. See details ---> {ex.Message}");

                return false;
            }
            
        }

        public async Task<List<T>> GetAllAsync()
        {
            var response = await _dbContext.Set<T>().AsNoTracking().ToListAsync();

            return response;
        }

        public async Task<T> GetById(Guid id)
        {
            var response = await _dbContext.Set<T>().Where(x => x.Id == id).AsNoTracking().FirstOrDefaultAsync();

            return response == null ? null : response;
        }

        public async Task<List<T>> GetQueryable(Expression<Func<T, bool>> filter, bool disableTracking = true)
        {
            IQueryable<T> query = _dbContext.Set<T>();

            if (disableTracking) query = query.AsNoTracking();

            if (filter != null) query = query.Where(filter);

            return query.ToList();
        }

        public async Task<T> UpdateAsync(T entity)
        {
            var data = await GetById(entity.Id);

            if (data == null) return null;

            _dbContext.Set<T>().Update(entity);

            await _dbContext.SaveChangesAsync();

            return entity;
        }
    }
}