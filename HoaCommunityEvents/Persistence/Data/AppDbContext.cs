using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HoaCommunityEvents.Persistence.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : IdentityDbContext<AppUser>(options)
{
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventAttendance> EventAttendances => Set<EventAttendance>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Event>(entity =>
        {
            entity.Property(e => e.Status)
                .HasMaxLength(30)
                .HasDefaultValue("Published");

            entity.HasOne(e => e.Host)
                .WithMany()
                .HasForeignKey(e => e.HostUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<EventAttendance>(entity =>
        {
            entity.HasIndex(ea => new { ea.EventId, ea.UserId }).IsUnique();

            entity.HasOne(ea => ea.Event)
                .WithMany(e => e.Attendances)
                .HasForeignKey(ea => ea.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ea => ea.User)
                .WithMany(u => u.Attendances)
                .HasForeignKey(ea => ea.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
