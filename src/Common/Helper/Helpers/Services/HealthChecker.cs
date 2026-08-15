using Helpers.Settings;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Helpers.Services
{
    // 30 saniyede bir servislere health check atar. Eğer servisler çalışmıyorsa loglar.

    public class HealthChecker : BackgroundService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<HealthChecker> _logger;
        private readonly HealtCheckSettings _settings;

        public HealthChecker(IHttpClientFactory httpClientFactory, ILogger<HealthChecker> logger, IOptions<HealtCheckSettings> settings)
        {
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _settings = settings.Value;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var client = _httpClientFactory.CreateClient();

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var response = await client.GetAsync(_settings.EndPoint.Uri);

                    if (response.IsSuccessStatusCode) _logger.LogInformation($"{_settings.EndPoint.Name} is UP");

                    else
                    {
                        _logger.LogError($"{_settings.EndPoint.Name} is DOWN. See details ---> {response.StatusCode} - {response.ReasonPhrase}");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"{_settings.EndPoint.Name} could not connect. See details ----> {ex.Message}");
                }

                await Task.Delay(TimeSpan.FromSeconds(_settings.IntervalSeconds), stoppingToken);
            }
        }
    }
}