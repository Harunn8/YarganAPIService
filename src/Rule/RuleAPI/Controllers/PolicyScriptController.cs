using Microsoft.AspNetCore.Mvc;
using RuleApplication.Models;
using RuleApplication.Services.Base;

namespace RuleAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PolicyScriptController : ControllerBase
    {
        private readonly IPolicyScriptService _service;

        public PolicyScriptController(IPolicyScriptService service)
        {
            _service = service;
        }

        [HttpGet("getall")]
        public async Task<ActionResult> GetAllPolicyScript()
        {
            var response = await _service.GetAllPolicyScript();

            return response.Count() == 0 ? NotFound("No Policy Script Found") : Ok(response);
        }

        [HttpGet("getbyid/{id}")]
        public async Task<ActionResult> GetPolicyScriptById(Guid id)
        {
            var response = await _service.GetPolicyScriptById(id);

            return response == null ? NotFound("No Policy Script Found") : Ok(response);
        }

        [HttpPost("add")]
        public async Task<ActionResult> AddPolicyScript([FromBody] AddScriptModel addModel)
        {
            var response = await _service.AddPolicyScript(addModel);

            return response == null ? BadRequest("Failed to add Policy Script") : Ok(response);
        }

        [HttpPut("update")]
        public async Task<ActionResult> UpdatePolicyScript([FromBody] UpdateScriptModel updateModel)
        {
            var response = await _service.UpdatePolicyScript(updateModel);

            return response == null ? BadRequest("Failed to update Policy Script") : Ok(response);
        }

        [HttpPut("runpolicyscript/{id}")]
        public async Task<ActionResult> RunPolicyScript(Guid id)
        {
            var response = await _service.RunScript(id);

            return response == false ? BadRequest("Failed to start or stop Policy Script") : Ok(response);
        }

        [HttpDelete("delete/{id}")]
        public async Task<ActionResult> DeletePolicyScriptById(Guid id)
        {
            var response = await _service.DeletePolicyScriptById(id);

            return response == false ? BadRequest("Failed to delete Policy Script") : Ok(response);
        }
    }
}