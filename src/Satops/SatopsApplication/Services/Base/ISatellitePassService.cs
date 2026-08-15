using SatopsApplication.Models;
using SatopsApplication.Responses;

namespace SatopsApplication.Services.Base
{
    public interface ISatellitePassService
    {
        Task<SatellitePassResponse> GetPassById(Guid id);
        Task<List<SatellitePassResponse>> GetAllPasses();
        Task<SatellitePassResponse> AddPass(AddSatelliteModel addModel);
        Task<List<SatellitePassResponse>> AddPasses(List<AddSatelliteModel> addModel);
        public Task<List<SatellitePassResponse>> AddPassesFromTle(List<SatellitePassResponseFromTle> addPassesFromTleModel);
        Task<SatellitePassResponse> UpdatePass(UpdateSatelliteModel updateModel);
        Task<bool> DeletePassbyId(Guid id);
        Task<bool> DeleteAllPasses();
        Task<bool> AutoStartOrStop(bool status);
    }
}