using DeviceApplication.Models;
using DeviceApplication.Services.Base;
using Microsoft.AspNetCore.Mvc;
using YarganCore;

namespace DeviceAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagController : ControllerBase
    {
        private readonly IPagService _service;

        public PagController(IPagService service)
        {
            _service = service;
        }

        [HttpGet("getall")]
        public async Task<ActionResult<ApiResponse>> GetAllPags()
        {
            var response = await _service.GetAllPags();

            return response.Count == 0 ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pags not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpGet("getbydeviceid/{deviceId}")]
        public async Task<ActionResult<ApiResponse>> GetPagWithDeviceId(Guid deviceId)
        {
            var response = await _service.GetPagWithDeviceId(deviceId);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag not found") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse>> AddPag([FromBody] AddPagModel addPagModel)
        {
            var response = await _service.AddPag(addPagModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag could not add") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse>> UpdatePag([FromBody] UpdatePagModel updatePagModel)
        {
            var response = await _service.UpdatePag(updatePagModel);

            return response == null ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag could not update") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }

        [HttpDelete]
        public async Task<ActionResult<ApiResponse>> DeletePag(Guid id)
        {
            var response = await _service.DeletePag(id);

            return !response ? new ApiResponse(System.Net.HttpStatusCode.BadRequest, null, $"Pag could not delete") : new ApiResponse(System.Net.HttpStatusCode.OK, response);
        }
    }
}