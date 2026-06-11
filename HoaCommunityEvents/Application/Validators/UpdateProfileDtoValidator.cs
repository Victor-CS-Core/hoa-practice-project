using FluentValidation;
using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Validators;

public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
{
    public UpdateProfileDtoValidator()
    {
        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .Length(2, 80);

        RuleFor(x => x.Bio)
            .MaximumLength(500)
            .When(x => !string.IsNullOrWhiteSpace(x.Bio));

        RuleFor(x => x.ProfileImageUrl)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.ProfileImageUrl))
            .WithMessage("ProfileImageUrl must be a valid absolute URL.");

        RuleFor(x => x.BannerImageUrl)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.BannerImageUrl))
            .WithMessage("BannerImageUrl must be a valid absolute URL.");
    }

    private static bool BeValidUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}
