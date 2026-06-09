namespace HoaCommunityEvents.Application.DTOs;

public class EventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string LocationWithinCommunity { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxAttendees { get; set; }
    public string? ImageUrl { get; set; }
    public string HostUserId { get; set; } = string.Empty;
    public string HostDisplayName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int AttendeeCount { get; set; }
    public bool IsCurrentUserAttending { get; set; }
}
