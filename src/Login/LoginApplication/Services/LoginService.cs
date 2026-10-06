using LoginApplication.HttpClients.Services.Base;
using LoginApplication.Models;
using LoginApplication.Services.Base;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace LoginApplication.Services
{
    public class LoginService : ILoginService
    {
        private static string secretKey = "X9zK2mP8vL5qN0jW7rT4yU1bC3fH6gJ9";
        private readonly IUserAPIClient _userClient;

        public LoginService(IUserAPIClient userClient)
        {
            _userClient = userClient;
        }

        public async Task<string> Login(LoginModel model)
        {
            var userResponse = await _userClient.Login(model.Username, model.Password);

            if (!userResponse) return null;

            return await GenerateToken(model.Username);
        }

        public Task<bool> Logout()
        {
            throw new NotImplementedException();
        }

        private async Task<string> GenerateToken(string username)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, username),
                new Claim(ClaimTypes.Name, username),                              
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(2),
                Issuer = "https://yargan.com",
                Audience = "https://yargan.com",
                SigningCredentials = credentials
            };

            var tokenHandler = new JwtSecurityTokenHandler();

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}