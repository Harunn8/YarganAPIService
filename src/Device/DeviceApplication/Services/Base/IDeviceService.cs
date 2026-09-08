using DeviceApplication.Models;
using DeviceApplication.Responses;

namespace DeviceApplication.Services.Base
{
    public interface IDeviceService
    {
        Task<List<DeviceResponse>> GetAllDevice();
        Task<DeviceResponse> GetDeviceById(Guid id);
        Task<List<DeviceResponse>> GetSNMPDevices();
        Task<List<DeviceResponse>> GetTCPDevices();
        Task<List<DeviceResponse>> GetDevicesByPagId(Guid pagId);
        Task<DeviceResponse> AddSNMPDevice(AddSNMPDeviceModel addSnmpModel);
        Task<DeviceResponse> AddTCPDevice(AddTCPDeviceModel addTcpModel);
        Task<DeviceResponse> UpdateDevice(UpdateDeviceModel updateModel); // SNMP ve TCP modelleri sonradan eklenecektir.
        Task<bool> DeleteDevice(Guid id);
    }
}