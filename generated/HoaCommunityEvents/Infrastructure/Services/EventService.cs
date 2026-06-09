using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace HoaCommunityEvents.Infrastructure.Services;

public class EventService(AppDbContext dbContext) : IEventService
{
    public async Task<IReadOnlyList<EventDto>> GetEventsAsync(EventFilterDto filter, string? currentUserId)
    {
        var query = dbContext.Events
            .AsNoTracking()
            .Include(e => e.Host)
            .Include(e => e.Attendances)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            query = query.Where(e => e.Category == filter.Category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(e => e.Status == filter.Status);
        }

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "latest" => query.OrderByDescending(e => e.StartDate),
            _ => query.OrderBy(e => e.StartDate)
        };

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 20 : Math.Min(filter.PageSize, 100);

        return await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                Category = e.Category,
                LocationWithinCommunity = e.LocationWithinCommunity,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                MaxAttendees = e.MaxAttendees,
                ImageUrl = e.ImageUrl,
                HostUserId = e.HostUserId,
                HostDisplayName = e.Host != null ? e.Host.DisplayName : string.Empty,
                Status = e.Status,
                AttendeeCount = e.Attendances.Count,
                IsCurrentUserAttending = currentUserId != null && e.Attendances.Any(a => a.UserId == currentUserId)
            })
            .ToListAsync();
    }

    public async Task<EventDto?> GetEventAsync(Guid id, string? currentUserId)
    {
        return await dbContext.Events
            .AsNoTracking()
            .Include(e => e.Host)
            .Include(e => e.Attendances)
            .Where(e => e.Id == id)
            .Select(e => new EventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                Category = e.Category,
                LocationWithinCommunity = e.LocationWithinCommunity,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                MaxAttendees = e.MaxAttendees,
                ImageUrl = e.ImageUrl,
                HostUserId = e.HostUserId,
                HostDisplayName = e.Host != null ? e.Host.DisplayName : string.Empty,
                Status = e.Status,
                AttendeeCount = e.Attendances.Count,
                IsCurrentUserAttending = currentUserId != null && e.Attendances.Any(a => a.UserId == currentUserId)
            })
            .FirstOrDefaultAsync();
    }
}
