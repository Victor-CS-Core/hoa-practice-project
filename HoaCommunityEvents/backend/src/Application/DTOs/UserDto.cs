namespace HoaCommunityEvents.Application.DTOs;

public class UserDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public double ProfileImagePositionX { get; set; } = 50;
    public double ProfileImagePositionY { get; set; } = 50;
    public double ProfileImageZoom { get; set; } = 1;
}
