using Microsoft.AspNetCore.Mvc;
using RuleApplication.Models;
using RuleApplication.Services.Base;

namespace RuleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CronPolicyController : ControllerBase
    {
        private readonly ICronPolicyService _service;

        public CronPolicyController(ICronPolicyService service)
        {
            _service = service;
        }

        [HttpGet("getall")]
        public async Task<ActionResult> GetAllCronPolicy()
        {
            var response = await _service.GetAllCronPolicy();

            return Ok(response);
        }

        [HttpGet("getbyid/{id}")]
        public async Task<ActionResult> GetCronPolicyById(Guid id)
        {
            var response = await _service.GetCronPolicyById(id);

            return Ok(response);
        }

        [HttpPost("add")]
        public async Task<ActionResult> AddCronPolicy([FromBody] AddCronPolicyModel addCronPolicyModel)
        {
            var response = await _service.AddCronPolicy(addCronPolicyModel);

            return Ok(response);
        }

        [HttpPut("update")]
        public async Task<ActionResult> UpdateCronPolicy([FromBody] UpdateCronPolicyModel updateCronPolicyModel)
        {
            var response = await _service.UpdateCronPolicy(updateCronPolicyModel);

            return Ok(response);
        }

        [HttpPut("startorstop")]
        public async Task<ActionResult> StartOrStopCronPolicy(Guid id, bool isStart)
        {
            var response = await _service.StartOrStopCronPolicy(id, isStart);

            return Ok(response);
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> DeleteCronPolicy(Guid id)
        {
            var response = await _service.DeleteCronPolicy(id);

            return Ok(response);
        }
    }
}