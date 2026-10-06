using FluentValidation;
using UserApplication.Models;

namespace UserApplication.Validations
{
    public class UserValidations : AbstractValidator<AddUserModel>
    {
        public UserValidations()
        {
            RuleFor(x => x.UserName).NotEmpty().WithMessage("User name is required.");
            RuleFor(x => x.Email).NotEmpty().WithMessage("Email is required.").EmailAddress().WithMessage("Invalid email address.");
            RuleFor(x => x.Password).NotEmpty().WithMessage("Password is required.").MinimumLength(6).WithMessage("Password must be at least 6 characters long.");
        }
    }
}