using AutoMapper;
using DataInUseApplication.Models;
using DataInUseApplication.Responses;
using YarganCore.Entities;

namespace DataInUseApplication.Mapper
{
    public class DataInUseMappingProfile : Profile
    {
        public DataInUseMappingProfile()
        {
            CreateMap<DataInUses, AddDataInUseModel>().ReverseMap();
            CreateMap<DataInUses, DataInUseResponse>().ReverseMap();
            CreateMap<DataInUses, UpdateDataInUseModel>().ReverseMap();
        }
    }
}