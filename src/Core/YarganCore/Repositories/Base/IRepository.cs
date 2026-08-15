using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Text;
using YarganCore.Entities.Base;

namespace YarganCore.Repositories.Base
{
    public interface IRepository<T> where T : BaseEntity 
    {
        public Task<T> AddAsync(T entity);
        public Task<List<T>> GetAllAsync();
        public Task<T> GetById(Guid id);
        public Task<List<T>> GetQueryable(Expression<Func<T, bool>> filter);
        public Task<bool> Delete(Guid id);
        public Task<bool> DeleteAll();
        public Task<T> UpdateAsync(T entity);
    }
}