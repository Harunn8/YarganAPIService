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

    public class AlarmValidations : AbstractValidator<AddAlarmModel>
    {
        public AlarmValidations()
        {
            RuleFor(x => x.Name).NotEmpty().NotNull().WithMessage("Alarm name is requiered");
            RuleFor(x => x.PagDeviceId).NotEmpty().NotNull().WithMessage("Pag device id is requiered");
            RuleFor(x => x.FirstCondition).NotEmpty().NotNull().WithMessage("First condition is requiered");
            RuleFor(x => x.FirstThreshold).NotEmpty().NotNull().WithMessage("First threshold is requiered");
            RuleFor(x => x.Severity).NotEmpty().NotNull().WithMessage("Severity is requiered");
        }
    }
}