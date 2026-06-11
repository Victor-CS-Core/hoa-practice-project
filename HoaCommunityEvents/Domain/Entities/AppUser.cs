using Microsoft.AspNetCore.Identity;

namespace HoaCommunityEvents.Domain.Entities;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? BannerImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<EventAttendance> Attendances { get; set; } = new List<EventAttendance>();
}
