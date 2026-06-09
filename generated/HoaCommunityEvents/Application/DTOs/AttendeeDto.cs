namespace HoaCommunityEvents.Application.DTOs;

public class AttendeeDto
{
    public string UserId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? ProfileImageUrl { get; set; }
    public DateTime JoinedAt { get; set; }
}
