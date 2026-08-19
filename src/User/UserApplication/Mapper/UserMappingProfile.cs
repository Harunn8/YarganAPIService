namespace UserApplication.Mapper
{
    public class UserMappingProfile : Profile
    {
        public UserMappingProfile(Parameters)
        {
            CreateMap<Users,AddUserModel>().ReverseMap();
            CreateMap<Users,UserResponse>().ReverseMap(); 
        }
    }
}