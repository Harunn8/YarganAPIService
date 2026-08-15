using AutoMapper;
using SatopsApplication.Models;
using SatopsApplication.Responses;
using SatopsApplication.Services.Base;
using YarganCore.Repositories;
using SGPdotNET.Observation;
using SGPdotNET.CoordinateSystem;
using SGPdotNET.Util;
using SatopsApplication.HttpClients.Clients.Base;

namespace SatopsApplication.Services
{
    public class TleService : ITleService
    {
        private readonly TleRepository _repository;
        private readonly IMapper _mapper;
        private readonly IRuleApiHttpClients _ruleApiClient;

        public TleService(TleRepository repository, IMapper mapper, IRuleApiHttpClients ruleApiClient)
        {
            _repository = repository;
            _mapper = mapper;
            _ruleApiClient = ruleApiClient;
        }


        // Girilen bilgilerin ardından response olarak geçişleri dönecektir.
        public async Task<List<SatellitePassResponseFromTle>> AddTle(AddTleModel addModel)
        {
            var alreadyTle = await GetTle();

            if (alreadyTle != null) await DeleteTle();

            var entity = _mapper.Map<YarganCore.Entities.Tle>(addModel);

            //var tleDataConvertedJson = JsonConvert.SerializeObject<TleData>(entity.TleData);

            var response = await _repository.AddAsync(entity);

            var passes = await GetActivePasses(response);

            return passes;
        }

        private async Task<List<SatellitePassResponseFromTle>> GetActivePasses(YarganCore.Entities.Tle tleModel)
        {
            if (tleModel == null) return null;

            var passes = new List<SatellitePassResponseFromTle>();

            var locations = new GeodeticCoordinate(tleModel.Latitude, tleModel.Longitude, tleModel.Altitude / 1000.0);

            var groundStation = new GroundStation(locations);

            var turkeyTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");

            foreach (var tle in tleModel.TleData)
            {
                try
                {
                    var satellite = new Satellite(tle.SatelliteName, tle.Line1, tle.Line2);

                    var observation = groundStation.Observe(satellite, DateTime.SpecifyKind(tleModel.StartAt, DateTimeKind.Local), DateTime.SpecifyKind(tleModel.EndAt, DateTimeKind.Local), TimeSpan.FromSeconds(10), Angle.FromDegrees(tleModel.MinElevation));

                    if (observation.Count == 0) continue;

                    foreach (var pass in observation)
                    {
                        var passResponse = new SatellitePassResponseFromTle
                        {
                            Name = pass.Satellite.Name,
                            AOS = TimeZoneInfo.ConvertTimeFromUtc(pass.Start, turkeyTimeZone),
                            LOS = TimeZoneInfo.ConvertTimeFromUtc(pass.End, turkeyTimeZone),
                            Duration = Math.Round(Convert.ToDouble((pass.End - pass.Start).TotalMinutes),2)
                        };

                        passes.Add(passResponse);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Tle data is invalid. See details ----> {ex.Message}");
                }
            }

            return passes.OrderBy(x => x.AOS).ToList();
        }

        public async Task<bool> DeleteTle()
        {
            var response = await _repository.DeleteAll();

            return response == true ? true : false;
        }

        // SatellitePassService içerisinde AutoSchedule işlemi için gerekli olan uyduları getirmek için kullanılacak method.
        public async Task<List<SatellitePassResponseFromTle>> GetPassesFromTle()
        {
            var tleData = await _repository.GetTleByDefault();

            if (tleData == null) return null;

            var passes = await GetActivePasses(tleData);

            return passes;
        }

        public async Task<TleResponse> GetTle()
        {
            var response = await _repository.GetTleByDefault();

            if (response == null) return null;

            return _mapper.Map<TleResponse>(response);
        }

        public async Task<List<ActiveTleResponses>> GetActiveTle(string satelliteName)
        {
            if (string.IsNullOrWhiteSpace(satelliteName)) return null;

            var response = await _ruleApiClient.GetActiveTleResponse(satelliteName);

            return response;
        }
    }
}