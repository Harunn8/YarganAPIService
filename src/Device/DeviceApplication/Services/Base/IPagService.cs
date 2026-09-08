using DeviceApplication.Models;
using DeviceApplication.Responses;

namespace DeviceApplication.Services.Base
{
    public interface IPagService
    {
        Task<List<PagResponse>> GetAllPags();
        Task<PagResponse> GetPagWithDeviceId(Guid deviceId);
        Task<PagResponse> AddPag(AddPagModel addModel);
        Task<PagResponse> UpdatePag(UpdatePagModel updateModel);
        Task<bool> DeletePag(Guid id);
    }
}