using HoaCommunityEvents.Domain.Common;

namespace HoaCommunityEvents.Domain.Entities;

public class EventAttendance : BaseEntity
{
    public Guid EventId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Event? Event { get; set; }
    public AppUser? User { get; set; }
}
