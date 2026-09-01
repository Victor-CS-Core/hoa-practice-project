namespace HoaCommunityEvents.Application.DTOs;

public sealed class AntiforgeryTokenDto
{
    public string RequestToken { get; init; } = string.Empty;
}
