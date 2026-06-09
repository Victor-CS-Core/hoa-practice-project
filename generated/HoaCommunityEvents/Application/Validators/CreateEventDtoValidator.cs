using FluentValidation;
using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Validators;

public class CreateEventDtoValidator : AbstractValidator<CreateEventDto>
{
    public CreateEventDtoValidator()
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
    }

    private static bool BeValidUrl(string? value)
    {
        return Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}
