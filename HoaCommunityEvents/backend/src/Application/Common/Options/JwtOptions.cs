namespace HoaCommunityEvents.Application.Common.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "HoaCommunityEvents.API";
    public string Audience { get; set; } = "HoaCommunityEvents.Client";
}
