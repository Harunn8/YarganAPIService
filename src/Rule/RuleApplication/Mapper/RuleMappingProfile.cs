using AutoMapper;
using RuleApplication.Models;
using RuleApplication.Responses;
using YarganCore.Entities;

namespace RuleApplication.Mapper
{
    public class RuleMappingProfile : Profile
    {
        public RuleMappingProfile()
        {
            CreateMap<Scripts, AddScriptModel>().ReverseMap();
            CreateMap<Scripts, PolicyScriptResponse>().ReverseMap();
            CreateMap<Scripts, UpdateScriptModel>().ReverseMap();
            
            CreateMap<CronPolicies,AddCronPolicyModel>().ReverseMap();
            CreateMap<CronPolicies, UpdateCronPolicyModel>().ReverseMap();
            CreateMap<CronPolicies, CronPolicyResponse>().ReverseMap();
        }
    }
}