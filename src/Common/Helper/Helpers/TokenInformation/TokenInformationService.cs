using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Helpers.TokenInformation
{
    public interface ITokenInformationService
    {
        string GetUserName();
        string GetUserId();
    }

    public class TokenInformationService : ITokenInformationService
    {
        private readonly IHttpContextAccessor _httpAccessor;

        public TokenInformationService(IHttpContextAccessor httpAccessor)
        {
            _httpAccessor = httpAccessor;
        }

        public string GetUserName()
        {
            var user = _httpAccessor.HttpContext?.User;

            if(user == null || !user.Identity.IsAuthenticated) return "Anonymous"; // Anonymous kullanıcı hiçbir işlem yapamaz. Bunun için onbefore middleware yazılacak.

            return user.FindFirst(ClaimTypes.Name)?.Value
                 ?? user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                 ?? user.FindFirst("sub")?.Value
                 ?? user.FindFirst("username")?.Value
                 ?? "Anonymous";
        }

        public string GetUserId() => _httpAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
