using DeviceApplication.Services.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

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
        public async Task<ActionResult> GetAllDevice()
        {
            var response = await _service.GetAllDevice();

            return response.Count == 0 ? NotFound() : Ok(response);
        }

        [HttpGet]
        public async Task<ActionResult> GetDeviceById(Guid id)
        {

        }
    }
}
