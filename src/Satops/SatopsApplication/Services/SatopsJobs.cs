using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SatopsApplication.HttpClients.Clients.Base;
using YarganCore.Repositories;

namespace SatopsApplication.Services
{
    public class SatopsJobs : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public SatopsJobs(IServiceScopeFactory scopoeFactory)
        {
            _scopeFactory = scopoeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

                using (var scope = _scopeFactory.CreateScope())
                {
                    var repository = scope.ServiceProvider.GetRequiredService<SatellitePassesRepository>();

                    var ruleClient = scope.ServiceProvider.GetRequiredService<IRuleApiHttpClients>();

                    var trackedPasses = (await repository.GetQueryable(x => x.LOS.AddMinutes(1) <= DateTime.Now)).Select(x => x.PolicyScriptId);

                    if (!trackedPasses.Any()) continue;

                    foreach(var trackedPass in trackedPasses)
                    {
                        var deletePolicyScriptStatus = await ruleClient.DeletePolicyScript(trackedPass);

                        if(deletePolicyScriptStatus) continue;

                        Console.WriteLine("Pass script could not delete");
                    }
                }
            }
        }
    }
}