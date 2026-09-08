using Helpers.UserLogService.Model;
using System;
using System.Collections.Generic;
using System.Text;

namespace Helpers.UserLogService.Service.Base
{
    public interface IUserLogService
    {
        Task SetEventLog(UserLogs logModel);
    }
}
