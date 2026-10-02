using System;
using System.Collections.Generic;
using System.Text;

namespace DataInUseApplication.HttpClients.Base
{
    public interface IDeviceAPIClient
    {
        public Task<HttpResponseMessage> GetDeviceById(Guid id);
    }
}
