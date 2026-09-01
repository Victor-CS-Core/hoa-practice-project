using Microsoft.AspNetCore.Identity;

namespace HoaCommunityEvents.Domain.Entities;

public class AppUser : IdentityUser
{
    public string DisplayName { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public double ProfileImagePositionX { get; set; } = 50;
    public double ProfileImagePositionY { get; set; } = 50;
    public double ProfileImageZoom { get; set; } = 1;
    public string? BannerImageUrl { get; set; }
    public double BannerImagePositionX { get; set; } = 50;
    public double BannerImagePositionY { get; set; } = 50;
    public double BannerImageZoom { get; set; } = 1;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<EventAttendance> Attendances { get; set; } = new List<EventAttendance>();
}
