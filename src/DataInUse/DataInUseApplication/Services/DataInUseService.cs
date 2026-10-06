using DataInUseApplication.HttpClients.Base;
using DataInUseApplication.Models;
using DataInUseApplication.Responses;
using DataInUseApplication.Services.Base;
using System;
using System.Collections.Generic;
using System.Text;
using YarganCore.Repositories;

namespace DataInUseApplication.Services
{
    public class DataInUseService : IDataInUseService
    {
        private readonly DataInUseRepository _repository;
        private readonly IDeviceAPIClient _deviceApiClient;

        public DataInUseService(DataInUseRepository repository, IDeviceAPIClient deviceApiClient)
        {
            _repository = repository;
            _deviceApiClient = deviceApiClient;
        }

        public Task<DataInUseResponse> AddDataInUse(AddDataInUseModel addModel)
        {
            throw new NotImplementedException();
        }

        public Task<List<DataInUseResponse>> AddDataInUseList(List<AddDataInUseModel> addModelList)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteDataInUse(Guid id)
        {
            throw new NotImplementedException();
        }

        public Task<bool> DeleteDataInUsesByDataId(Guid dataId)
        {
            throw new NotImplementedException();
        }

        public Task<List<DataInUseResponse>> GetDataInUseByDataId(Guid dataId)
        {
            throw new NotImplementedException();
        }

        public Task<DataInUseResponse> GetDataInUseByEntityId(Guid entityId)
        {
            throw new NotImplementedException();
        }

        public Task<DataInUseResponse> UpdateDataInUse(UpdateDataInUseModel updateModel)
        {
            throw new NotImplementedException();
        }
    }
}