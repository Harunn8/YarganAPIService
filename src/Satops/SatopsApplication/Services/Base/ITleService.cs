using SatopsApplication.Models;
using SatopsApplication.Responses;

namespace SatopsApplication.Services.Base
{
    public interface ITleService
    {
        public Task<TleResponse> GetTle();
        public Task<List<SatellitePassResponseFromTle>> GetPassesFromTle(); // GetTle metodunu kullanarak güncel geçişleri getirir.
        public Task<List<SatellitePassResponseFromTle>> AddTle(AddTleModel addModel);
        public Task<bool> DeleteTle();
        public Task<List<ActiveTleResponses>> GetActiveTle(string satelliteName);
    }
}