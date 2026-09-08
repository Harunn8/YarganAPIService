using AutoMapper;
using DeviceApplication.Models;
using DeviceApplication.Responses;
using YarganCore.Entities;

namespace DeviceApplication.Mapper
{
    public class DeviceMappingProfile : Profile
    {
        public DeviceMappingProfile()
        {
            CreateMap<Devices, AddDeviceModel>().ReverseMap();
            CreateMap<Devices, UpdateDeviceModel>().ReverseMap();
            CreateMap<Devices, DeviceResponse>().ReverseMap();

            CreateMap<Pags, AddPagModel>().ReverseMap();
            CreateMap<Pags, UpdatePagModel>().ReverseMap();
            CreateMap<Pags, PagResponse>().ReverseMap();

            CreateMap<PagDevices, AddPagDeviceModel>().ReverseMap();
            CreateMap<PagDevices, UpdatePagDeviceModel>().ReverseMap();
            CreateMap<PagDevices, PagDeviceResponse>().ReverseMap();
        }
    }
}