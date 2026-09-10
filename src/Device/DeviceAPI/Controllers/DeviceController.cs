using DeviceApplication.Models;
using DeviceApplication.Services.Base;
using Microsoft.AspNetCore.Mvc;
using YarganCore;

namespace DeviceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeviceController : ControllerBase
    {
        private readonly IDeviceService _service;

        public DeviceController(IDeviceService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetAllDevice()
        {
            var response = await _service.GetAllDevice();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound,null,"Devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK,response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetDeviceById(Guid id)
        {
            var response = await _service.GetDeviceById(id);
            
            return response == null ? new ApiResponse(System.Net.HttpStatusCode.NotFound,null,"Device not found") : new ApiResponse(System.Net.HttpStatusCode.OK,response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetSNMPDevices()
        {
            var response = await _service.GetSNMPDevices();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse>> GetTCPDevices()
        {
            var response = await _service.GetTCPDevices();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPost("addsnmpdevice")]
        public async Task<ActionResult<ApiResponse>> AddSNMPDevice([FromBody]AddSNMPDeviceModel addSnmpDeviceModel)
        {
            var response = await _service.AddSNMPDevice(addSnmpDeviceModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Device could not add") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> AddTCPDevice(AddTCPDeviceModel addTcpDeviceModel)
        {
            var response = await _service.AddTCPDevice(addTcpDeviceModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Device could not add") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse>> UpdateDevice(UpdateDeviceModel updateDeviceModel)
        {
            var response = await _service.UpdateDevice(updateDeviceModel);

            return response != null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Device could not update") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse>> UpdateSNMPDevice(UpdateSNMPDeviceModel updateSnmpDeviceModel)
        {
            var response = await _service.UpdateSNMPDevice(updateSnmpDeviceModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Device could not update") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpDelete]
        public async Task<ActionResult<ApiResponse>> DeleteDevice(Guid id)
        {
            var response = await _service.DeleteDevice(id);

            return response ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Device could not delete") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }
    }
}