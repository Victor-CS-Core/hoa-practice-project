using HoaCommunityEvents.Domain.Common;

namespace HoaCommunityEvents.Domain.Entities;

public class Event : BaseEntity
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string LocationWithinCommunity { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int? MaxAttendees { get; set; }
    public string? ImageUrl { get; set; }
    public string HostUserId { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";

    public AppUser? Host { get; set; }
    public ICollection<EventAttendance> Attendances { get; set; } = new List<EventAttendance>();
}
