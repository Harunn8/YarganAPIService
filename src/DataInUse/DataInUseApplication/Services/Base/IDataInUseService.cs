using DataInUseApplication.Models;
using DataInUseApplication.Responses;

namespace DataInUseApplication.Services.Base
{
    public interface IDataInUseService
    {
        public Task<DataInUseResponse> AddDataInUse(AddDataInUseModel addModel);
        public Task<List<DataInUseResponse>> AddDataInUseList(List<AddDataInUseModel> addModelList);
        public Task<List<DataInUseResponse>> GetDataInUseByDataId(Guid dataId);
        public Task<DataInUseResponse> GetDataInUseByEntityId(Guid entityId);
        public Task<DataInUseResponse> UpdateDataInUse(UpdateDataInUseModel updateModel);
        public Task<bool> DeleteDataInUsesByDataId(Guid dataId);
        public Task<bool> DeleteDataInUse(Guid id);
    }
}