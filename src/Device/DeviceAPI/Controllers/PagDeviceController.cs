using DeviceApplication.Models;
using DeviceApplication.Services.Base;
using Microsoft.AspNetCore.Mvc;
using YarganCore;

namespace DeviceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagDeviceController : ControllerBase
    {
        private readonly IPagDeviceService _service;

        public PagDeviceController(IPagDeviceService service)
        {
            _service = service;
        }

        [HttpGet("getall")]
        public async Task<ActionResult<ApiResponse>> GetAllPagDevice()
        {
            var response = await _service.GetAllPagDevice();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Pag devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet("getbydeviceid/{deviceId}")]
        public async Task<ActionResult<ApiResponse>> GetPagDevicesByDeviceId(Guid deviceId)
        {
            var response = await _service.GetPagDevicesByDeviceId(deviceId);

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Pag devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet("getbypagid/{pagId}")]
        public async Task<ActionResult<ApiResponse>> GetPagDevicesByPagId(Guid pagId)
        {
            var response = await _service.GetPagDevicesByPagId(pagId);

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Pag devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet("getbyid/{id}")]
        public async Task<ActionResult<ApiResponse>> GetPagDeviceById(Guid id)
        {
            var response = await _service.GetPagDeviceById(id);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.NotFound, null, "Pag device not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> AddPagDevice([FromBody] AddPagDeviceModel addModel)
        {
            var response = await _service.AddPagDevice(addModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Pag device could not add") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut("update")]
        public async Task<ActionResult<ApiResponse>> UpdatePagDevice([FromBody] UpdatePagDeviceModel updateModel)
        {
            var response = await _service.UpdatePagDevice(updateModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, "Pag device could not update") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut("startorstop")]
        public async Task<ActionResult<ApiResponse>> StartOrStopDevice(Guid id, bool isStart)
        {
            var response = await _service.StartOrStopCommunication(id, isStart);

            var status = isStart ? "started" : "stopped";

            return !response ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag device could not {status}") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut("startorstopmulti")]
        public async Task<ActionResult<ApiResponse>> StartOrStopMultiDevice(List<Guid> ids, bool isStart)
        {
            var response = await _service.StartOrStopMultiDevice(ids, isStart);

            var status = isStart ? "started" : "stopped";

            return !response ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag devices could not {status}") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet("getactive")]
        public async Task<ActionResult<ApiResponse>> GetActiveDevice()
        {
            var response = await _service.GetActivePagDevices();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag devices not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpDelete]
        public async Task<ActionResult<ApiResponse>> DeletePagDevice(Guid id)
        {
            var response = await _service.DeletePagDevice(id);

            return !response ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag devices could not delete") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }
    }
}