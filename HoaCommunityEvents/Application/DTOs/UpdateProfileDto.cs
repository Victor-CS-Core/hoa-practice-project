namespace HoaCommunityEvents.Application.DTOs;

public class UpdateProfileDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public double? ProfileImagePositionX { get; set; }
    public double? ProfileImagePositionY { get; set; }
    public double? ProfileImageZoom { get; set; }
    public string? BannerImageUrl { get; set; }
    public double? BannerImagePositionX { get; set; }
    public double? BannerImagePositionY { get; set; }
    public double? BannerImageZoom { get; set; }
}
