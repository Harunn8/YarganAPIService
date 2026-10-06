using AutoMapper;
using UserApplication.Models;
using UserApplication.Responses;
using YarganCore.Entities;

namespace UserApplication.Mapper
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile()
        {
            CreateMap<Users, AddUserModel>().ReverseMap();
            CreateMap<Users, UpdateUserModel>().ReverseMap();
            CreateMap<Users, UserResponse>().ReverseMap();
        }
    }
}