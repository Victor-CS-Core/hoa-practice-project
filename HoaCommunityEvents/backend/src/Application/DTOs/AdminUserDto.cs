namespace HoaCommunityEvents.Application.DTOs;

public class AdminUserDto
{
    public string DisplayName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public bool IsMasterAdmin { get; set; }
    public bool CanDelete { get; set; }
}
