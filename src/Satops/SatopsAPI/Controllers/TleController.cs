using Microsoft.AspNetCore.Mvc;
using SatopsApplication.Models;
using SatopsApplication.Services.Base;

namespace SatopsAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TleController : ControllerBase
    {
        private readonly ITleService _service;

        public TleController(ITleService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult> GetTle()
        {
            var response = await _service.GetTle();

            return response == null ? NotFound("Tle data not found") : Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult> AddTle([FromBody] AddTleModel addModel)
        {
            var response = await _service.AddTle(addModel);

            return response == null ? BadRequest("Tle data not created") : Ok(response);
        }

        [HttpGet("gettlewithpasses")]
        public async Task<ActionResult> GetTleWithPasses()
        {
            var response = await _service.GetPassesFromTle();

            return response.Count == 0 ? NotFound("Passes or tle data not found") : Ok(response);
        }

        [HttpGet("getactivetle")]
        public async Task<ActionResult> GetActiveTle(string satelliteName)
        {
            var response = await _service.GetActiveTle(satelliteName);

            return response == null ? NotFound("Tle not found") : Ok(response);
        }
    }
}