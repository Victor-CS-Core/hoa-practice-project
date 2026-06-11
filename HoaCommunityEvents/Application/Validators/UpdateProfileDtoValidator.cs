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

        RuleFor(x => x.ProfileImagePositionX)
            .InclusiveBetween(0, 100)
            .When(x => x.ProfileImagePositionX.HasValue)
            .WithMessage("ProfileImagePositionX must be between 0 and 100.");

        RuleFor(x => x.ProfileImagePositionY)
            .InclusiveBetween(0, 100)
            .When(x => x.ProfileImagePositionY.HasValue)
            .WithMessage("ProfileImagePositionY must be between 0 and 100.");

        RuleFor(x => x.ProfileImageZoom)
            .InclusiveBetween(1, 3)
            .When(x => x.ProfileImageZoom.HasValue)
            .WithMessage("ProfileImageZoom must be between 1 and 3.");

        RuleFor(x => x.BannerImageUrl)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.BannerImageUrl))
            .WithMessage("BannerImageUrl must be a valid absolute URL.");

        RuleFor(x => x.BannerImagePositionX)
            .InclusiveBetween(0, 100)
            .When(x => x.BannerImagePositionX.HasValue)
            .WithMessage("BannerImagePositionX must be between 0 and 100.");

        RuleFor(x => x.BannerImagePositionY)
            .InclusiveBetween(0, 100)
            .When(x => x.BannerImagePositionY.HasValue)
            .WithMessage("BannerImagePositionY must be between 0 and 100.");

        RuleFor(x => x.BannerImageZoom)
            .InclusiveBetween(1, 3)
            .When(x => x.BannerImageZoom.HasValue)
            .WithMessage("BannerImageZoom must be between 1 and 3.");
    }

    private static bool BeValidUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}
