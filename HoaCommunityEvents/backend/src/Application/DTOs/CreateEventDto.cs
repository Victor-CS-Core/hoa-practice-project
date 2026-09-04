namespace HoaCommunityEvents.Application.DTOs;

public class CreateEventDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string LocationWithinCommunity { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxAttendees { get; set; }
    public string? ImageUrl { get; set; }
    public double? ImagePositionX { get; set; }
    public double? ImagePositionY { get; set; }
    public double? ImageZoom { get; set; }
}
