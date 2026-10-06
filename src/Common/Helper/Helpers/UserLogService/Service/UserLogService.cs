using Helpers.UserLogService.Model;
using Helpers.UserLogService.Service.Base;
using MongoDB.Driver;

namespace Helpers.UserLogService.Service
{
    public class UserLogService : IUserLogService
    {
        private readonly IMongoCollection<UserLogs> _logs;

        public UserLogService(IMongoDatabase database)
        {
            _logs = database.GetCollection<UserLogs>("UserLogs");
        }

        public async Task SetEventLog(UserLogs logModel)
        {
            await _logs.InsertOneAsync(logModel);
        }
    }
}