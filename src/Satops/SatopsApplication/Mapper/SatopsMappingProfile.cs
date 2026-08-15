using AutoMapper;
using SatopsApplication.Models;
using SatopsApplication.Responses;
using YarganCore.Entities;

namespace SatopsApplication.Mapper
{
    public class SatopsMappingProfile : Profile
    {
        public SatopsMappingProfile()
        {
            CreateMap<SatellitePasses, SatellitePassResponse>().ReverseMap();
            CreateMap<SatellitePasses, AddSatelliteModel>().ReverseMap();
            CreateMap<SatellitePasses, UpdateSatelliteModel>().ReverseMap();

            CreateMap<SatellitePasses, SatellitePassResponseFromTle>().ReverseMap();
            CreateMap<SatellitePassResponse, SatellitePassResponseFromTle>().ReverseMap();

            CreateMap<Tle, AddTleModel>().ReverseMap();
            CreateMap<Tle, TleResponse>().ReverseMap();
        }
    }
}