using Helpers.Services;
using Helpers.Settings;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Helpers.Extensions
{
    public static class HealthCheckExtensions
    {
        public static IServiceCollection AddServiceHealthMonitoring(this IServiceCollection services, IConfiguration configuration)
        {
            services.Configure<HealtCheckSettings>(configuration.GetSection("HealthCheck"));

            services.AddHttpClient();

            services.AddHostedService<HealthChecker>();

            return services;
        }
    }
}