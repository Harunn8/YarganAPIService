using Microsoft.AspNetCore.Mvc;
using SatopsApplication.Models;
using SatopsApplication.Responses;
using SatopsApplication.Services.Base;

namespace SatopsAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SatellitePassController : ControllerBase
    {
        private readonly ISatellitePassService _service;

        public SatellitePassController(ISatellitePassService service)
        {
            _service = service;
        }

        [HttpGet("getallpasses")]
        public async Task<ActionResult> GetAllPasses()
        {
            var response = await _service.GetAllPasses();

            return response.Count == 0 ? NotFound("Could not pass find") : Ok(response);
        }

        [HttpGet("getpassbyid/{id}")]
        public async Task<ActionResult> GetPassById(Guid id)
        {
            var response = await _service.GetPassById(id);

            return response == null ? NotFound("Pass could not find") : Ok(response);
        }

        [HttpPost("addpass")]
        public async Task<ActionResult> AddPass([FromBody] AddSatelliteModel addModel)
        {
            var response = await _service.AddPass(addModel);

            return response == null ? BadRequest("Pass could not add") : Ok(response);
        }

        [HttpPost("getpassbyrange")]
        public async Task<ActionResult> AddPassesByRange([FromBody] List<AddSatelliteModel> addModels)
        {
            var response = await _service.AddPasses(addModels);

            return response.Count == 0 ? BadRequest("Passes could not add") : Ok(response);
        }

        [HttpPut("autostartorstop")]
        public async Task<ActionResult> AutoStartOrStop(bool status)
        {
            var response = await _service.AutoStartOrStop(status);

            return response == false ? BadRequest(response) : Ok(response);
        }

        [HttpPost("addpassesfromtle")]
        public async Task<ActionResult> AddPassesFromTle([FromBody] List<SatellitePassResponseFromTle> satellitePassResponseFromTles)
        {
            var response = await _service.AddPassesFromTle(satellitePassResponseFromTles);

            return response.Count == 0 ? NotFound("Passes not found") : Ok(response);
        }
    }
}