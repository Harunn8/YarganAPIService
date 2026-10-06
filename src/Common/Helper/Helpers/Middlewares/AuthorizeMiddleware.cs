using Helpers.TokenInformation;
using Microsoft.AspNetCore.Http;

namespace Helpers.Middlewares
{
    public class AuthorizeMiddleware
    {
        private readonly RequestDelegate _next;

        public AuthorizeMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, ITokenInformationService tokenInformationService)
        {
            var path = context.Request.Path.Value?.ToLower();

            bool isWhitelisted = path.Equals("/api/auth/login", StringComparison.OrdinalIgnoreCase) || path.StartsWith("/scalar") || path.StartsWith("/openapi")
                || path.Equals("/", StringComparison.OrdinalIgnoreCase)
                || path.Equals("/favicon.ico", StringComparison.OrdinalIgnoreCase) 
                || path.EndsWith("/login", StringComparison.OrdinalIgnoreCase);

            if (isWhitelisted)
            {
                await _next(context);
                
                return;
            }

            var userName = tokenInformationService.GetUserName();

            if(userName.Equals("Anonymous"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                
                await context.Response.WriteAsync("Unauthorized");
                
                return;
            }

            await _next(context);
        }
    }
}