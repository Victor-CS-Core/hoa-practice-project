using FluentValidation;
using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Validators;

public class EditEventDtoValidator : AbstractValidator<EditEventDto>
{
    public EditEventDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.Description)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(x => x.Category)
            .NotEmpty()
            .MaximumLength(80);

        RuleFor(x => x.LocationWithinCommunity)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(x => x.StartDate)
            .NotEmpty();

        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate)
            .WithMessage("EndDate must be after StartDate.");

        RuleFor(x => x.MaxAttendees)
            .GreaterThan(0)
            .When(x => x.MaxAttendees.HasValue);

        RuleFor(x => x.ImageUrl)
            .Must(BeValidUrl)
            .When(x => !string.IsNullOrWhiteSpace(x.ImageUrl))
            .WithMessage("ImageUrl must be a valid absolute URL.");

        RuleFor(x => x.ImagePositionX)
            .InclusiveBetween(0, 100)
            .When(x => x.ImagePositionX.HasValue)
            .WithMessage("ImagePositionX must be between 0 and 100.");

        RuleFor(x => x.ImagePositionY)
            .InclusiveBetween(0, 100)
            .When(x => x.ImagePositionY.HasValue)
            .WithMessage("ImagePositionY must be between 0 and 100.");

        RuleFor(x => x.ImageZoom)
            .InclusiveBetween(1, 3)
            .When(x => x.ImageZoom.HasValue)
            .WithMessage("ImageZoom must be between 1 and 3.");
    }

    private static bool BeValidUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}
