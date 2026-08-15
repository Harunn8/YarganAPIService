using FluentValidation;
using RuleApplication.Models;

namespace RuleApplication.Validations
{
    public class RuleValidations : AbstractValidator<AddScriptModel>
    {
        public RuleValidations()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.Script).NotEmpty().WithMessage("Script is required.");
        }
    }

    public class UpdateRuleValidations : AbstractValidator<UpdateScriptModel>
    {
        public UpdateRuleValidations()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required.");
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.Script).NotEmpty().WithMessage("Script is required.");
        }
    }

    public class CronPolicyValidations : AbstractValidator<AddCronPolicyModel>
    {
        public CronPolicyValidations()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.PolicyScriptId).NotEmpty().WithMessage("PolicyScriptId is required.");
            RuleFor(x => x.StartAt).NotEmpty().WithMessage("StartAt is required.");
            RuleFor(x => x.ForOnce).NotEmpty().WithMessage("ForOnce is required.");
        }
    }

    public class CronPolicyUpdateValidations : AbstractValidator<UpdateCronPolicyModel>
    {
        public CronPolicyUpdateValidations()
        {
            RuleFor(x => x.Id).NotEmpty().WithMessage("Id is required.");
            RuleFor(x => x.Name).NotEmpty().WithMessage("Name is required.");
            RuleFor(x => x.PolicyScriptId).NotEmpty().WithMessage("PolicyScriptId is required.");
            RuleFor(x => x.StartAt).NotEmpty().WithMessage("StartAt is required.");
            RuleFor(x => x.ForOnce).NotEmpty().WithMessage("ForOnce is required.");
        }
    }
}