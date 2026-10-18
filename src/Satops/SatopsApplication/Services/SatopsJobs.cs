using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SatopsApplication.HttpClients.Clients.Base;
using YarganCore.Repositories;

namespace SatopsApplication.Services
{
    public class SatopsJobs : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        // İşlenmiş geçişler; aynı geçiş için Rule API'ye her turda tekrar gidilmez.
        private readonly HashSet<Guid> _handledPasses = new HashSet<Guid>();

        public SatopsJobs(IServiceScopeFactory scopoeFactory)
        {
            _scopeFactory = scopoeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

                // Buradaki bir hata (ör. Rule API'ye ulaşılamaması) servisi durdurmamalı; bir sonraki turda tekrar denenir.
                try
                {
                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var repository = scope.ServiceProvider.GetRequiredService<SatellitePassesRepository>();

                        var ruleClient = scope.ServiceProvider.GetRequiredService<IRuleApiHttpClients>();

                        var trackedPasses = (await repository.GetQueryable(x => x.LOS.AddMinutes(1) <= DateTime.Now && x.PolicyScriptId != Guid.Empty))
                            .Where(x => !_handledPasses.Contains(x.Id));

                        foreach(var trackedPass in trackedPasses)
                        {
                            // Geçişin PolicyScriptId'si operatörün seçtiği script de olabilir; yalnızca bu geçiş için üretilen script silinir.
                            var policyScript = await ruleClient.GetPolicyScript(trackedPass.PolicyScriptId);

                            if (policyScript?.Name == $"{trackedPass.Name}_{trackedPass.AOS}")
                            {
                                var deletePolicyScriptStatus = await ruleClient.DeletePolicyScript(trackedPass.PolicyScriptId);

                                if (!deletePolicyScriptStatus) Console.WriteLine("Pass script could not delete");
                            }

                            _handledPasses.Add(trackedPass.Id);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Pass scripts could not be cleaned up. See details ---> {ex.Message}");
                }
            }
        }
    }
}