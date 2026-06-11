namespace HoaCommunityEvents.Application.DTOs;

public class UpdateProfileDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? BannerImageUrl { get; set; }
}
