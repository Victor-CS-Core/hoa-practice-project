using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace HoaCommunityEvents.Infrastructure.Services;

public class AttendanceService(AppDbContext dbContext, IEventUpdatePublisher eventUpdatePublisher) : IAttendanceService
{
    public async Task<(bool Success, int StatusCode, string? Error, int AttendeeCount)> JoinEventAsync(Guid eventId, string userId)
    {
        var evt = await dbContext.Events
            .Include(e => e.Attendances)
            .FirstOrDefaultAsync(e => e.Id == eventId);

        if (evt is null)
        {
            return (false, 404, "Event not found.", 0);
        }

        if (!evt.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            return (false, 409, "Cannot join an event until it is published.", evt.Attendances.Count);
        }

        if (evt.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return (false, 409, "Cannot join a cancelled event.", evt.Attendances.Count);
        }

        if (evt.EndDate <= DateTime.UtcNow)
        {
            return (false, 409, "Cannot join an event that already ended.", evt.Attendances.Count);
        }

        if (evt.Attendances.Any(a => a.UserId == userId))
        {
            return (false, 409, "User already joined this event.", evt.Attendances.Count);
        }

        if (evt.MaxAttendees.HasValue && evt.Attendances.Count >= evt.MaxAttendees.Value)
        {
            return (false, 409, "Event is full.", evt.Attendances.Count);
        }

        dbContext.EventAttendances.Add(new EventAttendance
        {
            EventId = eventId,
            UserId = userId,
            JoinedAt = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync();

        var attendeeCount = await dbContext.EventAttendances.CountAsync(a => a.EventId == eventId);
        await eventUpdatePublisher.PublishAsync(new EventUpdate(eventId, "attendance-changed"));

        return (true, 200, null, attendeeCount);
    }

    public async Task<(bool Success, int StatusCode, string? Error, int AttendeeCount)> LeaveEventAsync(Guid eventId, string userId)
    {
        var attendance = await dbContext.EventAttendances
            .FirstOrDefaultAsync(a => a.EventId == eventId && a.UserId == userId);

        if (attendance is null)
        {
            var count = await dbContext.EventAttendances.CountAsync(a => a.EventId == eventId);
            return (false, 409, "User is not attending this event.", count);
        }

        dbContext.EventAttendances.Remove(attendance);
        await dbContext.SaveChangesAsync();

        var attendeeCount = await dbContext.EventAttendances.CountAsync(a => a.EventId == eventId);
        await eventUpdatePublisher.PublishAsync(new EventUpdate(eventId, "attendance-changed"));

        return (true, 200, null, attendeeCount);
    }

    public async Task<IReadOnlyList<AttendeeDto>> GetAttendeesAsync(Guid eventId)
    {
        return await dbContext.EventAttendances
            .AsNoTracking()
            .Where(a => a.EventId == eventId)
            .Include(a => a.User)
            .OrderBy(a => a.JoinedAt)
            .Select(a => new AttendeeDto
            {
                UserId = a.UserId,
                DisplayName = a.User != null ? a.User.DisplayName : string.Empty,
                ProfileImageUrl = a.User != null ? a.User.ProfileImageUrl : null,
                JoinedAt = a.JoinedAt
            })
            .ToListAsync();
    }
}
