using FluentValidation;
using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Validators;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress();

        RuleFor(x => x.Username)
            .NotEmpty()
            .Length(3, 30)
            .Matches("^[a-zA-Z0-9_]+$");

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .Length(2, 80);

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8);
    }
}
