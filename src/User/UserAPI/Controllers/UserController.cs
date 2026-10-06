using Microsoft.AspNetCore.Mvc;
using UserApplication.Models;
using UserApplication.Services.Base;
using UserApplication.Validations;

namespace UserAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : Controller
    {
        private readonly IUserService _userService;
        private readonly UserValidations _validator;

        public UserController(IUserService userService)
        {
            _userService = userService;

            _validator = new UserValidations();
        }

        [HttpGet("GetAllUser")]
        public async Task<IActionResult> GetAllUser()
        {
            var users = await _userService.GetAllUser();

            return Ok(users);
        }

        [HttpGet("GetUserByRoleId/{roleId}")]
        public async Task<IActionResult> GetUserByRoleId(Guid roleId)
        {
            var user = await _userService.GetUserByRoleId(roleId);

            return Ok(user);
        }

        [HttpGet("GetUserByUserName/{userName}")]
        public async Task<ActionResult> GetUserByUserName(string userName)
        {
            var user = await _userService.GetUserByUserName(userName);

            return Ok(user);
        }

        [HttpPost("AddUser")]
        public async Task<IActionResult> AddUser(AddUserModel addModel)
        {
            var validation = await _validator.ValidateAsync(addModel);

            if (!validation.IsValid) return BadRequest(validation.Errors);

            var user = await _userService.AddUser(addModel);

            return Ok(user);
        }

        [HttpPut("UpdateUser")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserModel updateModel)
        {
            var user = await _userService.UpdateUser(updateModel);

            return Ok(user);
        }

        [HttpDelete("DeleteUser/{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var result = await _userService.DeleteUser(id);

            if (!result) return NotFound();

            return Ok();
        }

        [HttpGet("GetUserByEmail/{email}")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var user = await _userService.GetUserByEmail(email);

            return Ok(user);
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginModel loginModel)
        {
            var result = await _userService.Login(loginModel.UserName, loginModel.Password);

            if (!result) return Unauthorized();

            return Ok();
        }

        [HttpGet("GetUserById/{id}")]
        public async Task<IActionResult> GetUserById(Guid id)
        {
            var user = await _userService.GetUserById(id);

            return Ok(user);
        }

        [HttpPost("LogOut")]
        public async Task<IActionResult> LogOut()
        {
            var result = await _userService.LogOut();

            if (!result) return BadRequest();

            return Ok();
        }
    }
}