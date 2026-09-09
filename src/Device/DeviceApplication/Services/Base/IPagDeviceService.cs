using DeviceApplication.Models;
using DeviceApplication.Responses;

namespace DeviceApplication.Services.Base
{
    public interface IPagDeviceService
    {
        Task<List<PagDeviceResponse>> GetAllPagDevice();
        Task<List<PagDeviceResponse>> GetPagDevicesByDeviceId(Guid deviceId);
        Task<List<PagDeviceResponse>> GetPagDevicesByPagId(Guid pagId);
        Task<PagDeviceResponse> GetPagDeviceById(Guid id);
        Task<PagDeviceResponse> GetPagDeviceByName(string name);
        Task<PagDeviceResponse> AddPagDevice(AddPagDeviceModel addModel);
        Task<PagDeviceResponse> UpdatePagDevice(UpdatePagDeviceModel model);
        Task<bool> DeletePagDevice(Guid id);
        Task<bool> StartOrStopCommunication(Guid id, bool isStart);
        Task<bool> StartOrStopMultiDevice(List<Guid> pagDeviceIds, bool isStart);
        Task<List<PagDeviceResponse>> GetActivePagDevices();
    }
}