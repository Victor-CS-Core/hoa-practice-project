using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace HoaCommunityEvents.Infrastructure.Services;

public class EventService(AppDbContext dbContext) : IEventService
{
    public async Task<PagedResultDto<EventDto>> GetEventsAsync(EventFilterDto filter, string? currentUserId, bool isAdmin)
    {
        var now = DateTime.UtcNow;
        var query = dbContext.Events
            .AsNoTracking()
            .Include(e => e.Host)
            .Include(e => e.Attendances)
            .AsQueryable();

        if (!isAdmin || !filter.IncludePending)
        {
            query = query.Where(e => e.Status != "Pending");
        }

        if (!string.IsNullOrWhiteSpace(filter.Category))
        {
            query = query.Where(e => e.Category == filter.Category);
        }

        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            if (filter.Status.Equals("Ended", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(e =>
                    e.Status == "Published"
                    && e.EndDate <= now);
            }
            else if (filter.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(e =>
                    e.Status == "Published"
                    && e.EndDate > now);
            }
            else
            {
                query = query.Where(e => e.Status == filter.Status);
            }
        }

        query = filter.SortBy?.ToLowerInvariant() switch
        {
            "latest" => query.OrderByDescending(e => e.StartDate),
            _ => query.OrderBy(e => e.StartDate)
        };

        var page = filter.Page < 1 ? 1 : filter.Page;
        var pageSize = filter.PageSize < 1 ? 20 : Math.Min(filter.PageSize, 100);
        var totalCount = await query.CountAsync();

        var items = await query
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
                ImagePositionX = e.ImagePositionX,
                ImagePositionY = e.ImagePositionY,
                ImageZoom = e.ImageZoom,
                HostUserId = e.HostUserId,
                HostDisplayName = e.Host != null ? e.Host.DisplayName : string.Empty,
                Status = e.Status == "Published" && e.EndDate <= now
                    ? "Ended"
                    : e.Status,
                AttendeeCount = e.Attendances.Count,
                IsCurrentUserAttending = currentUserId != null && e.Attendances.Any(a => a.UserId == currentUserId)
            })
            .ToListAsync();

        return new PagedResultDto<EventDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<EventDto?> GetEventAsync(Guid id, string? currentUserId, bool isAdmin)
    {
        var now = DateTime.UtcNow;
        var evt = await dbContext.Events
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
                ImagePositionX = e.ImagePositionX,
                ImagePositionY = e.ImagePositionY,
                ImageZoom = e.ImageZoom,
                HostUserId = e.HostUserId,
                HostDisplayName = e.Host != null ? e.Host.DisplayName : string.Empty,
                Status = e.Status == "Published" && e.EndDate <= now
                    ? "Ended"
                    : e.Status,
                AttendeeCount = e.Attendances.Count,
                IsCurrentUserAttending = currentUserId != null && e.Attendances.Any(a => a.UserId == currentUserId)
            })
            .FirstOrDefaultAsync();

        if (evt is null)
        {
            return null;
        }

        if (!isAdmin && evt.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        return evt;
    }

    public async Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> CreateEventAsync(CreateEventDto dto, string hostUserId, bool canCreateInPast)
    {
        if (!canCreateInPast && dto.StartDate < DateTime.UtcNow)
        {
            return (false, 403, "Only master admin can create events in the past.", null);
        }

        var evt = new Event
        {
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            LocationWithinCommunity = dto.LocationWithinCommunity,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            MaxAttendees = dto.MaxAttendees,
            ImageUrl = dto.ImageUrl,
            ImagePositionX = dto.ImagePositionX ?? 50,
            ImagePositionY = dto.ImagePositionY ?? 50,
            ImageZoom = dto.ImageZoom ?? 1,
            HostUserId = hostUserId,
            Status = "Pending"
        };

        dbContext.Events.Add(evt);
        await dbContext.SaveChangesAsync();

        var created = await GetEventAsync(evt.Id, hostUserId, true);
        return (true, 201, null, created);
    }

    public async Task<EventDto?> EditEventAsync(Guid id, EditEventDto dto, string hostUserId)
    {
        var evt = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt is null)
        {
            return null;
        }

        evt.Title = dto.Title;
        evt.Description = dto.Description;
        evt.Category = dto.Category;
        evt.LocationWithinCommunity = dto.LocationWithinCommunity;
        evt.StartDate = dto.StartDate;
        evt.EndDate = dto.EndDate;
        evt.MaxAttendees = dto.MaxAttendees;
        evt.ImageUrl = dto.ImageUrl;
        evt.ImagePositionX = dto.ImagePositionX ?? 50;
        evt.ImagePositionY = dto.ImagePositionY ?? 50;
        evt.ImageZoom = dto.ImageZoom ?? 1;
        evt.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return await GetEventAsync(id, hostUserId, true);
    }

    public async Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> CancelEventAsync(Guid id)
    {
        var evt = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt is null)
        {
            return (false, 404, "Event was not found.", null);
        }

        if (evt.EndDate <= DateTime.UtcNow)
        {
            return (false, 409, "Cannot change status for an event that already ended.", null);
        }

        evt.Status = "Cancelled";
        evt.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return (true, 200, null, await GetEventAsync(id, null, true));
    }

    public async Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> PublishEventAsync(Guid id)
    {
        var evt = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt is null)
        {
            return (false, 404, "Event was not found.", null);
        }

        if (evt.EndDate <= DateTime.UtcNow)
        {
            return (false, 409, "Cannot change status for an event that already ended.", null);
        }

        if (evt.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            return (false, 409, "Event is already published.", null);
        }

        var isPending = evt.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase);
        var isCancelled = evt.Status.Equals("Cancelled", StringComparison.OrdinalIgnoreCase);

        if (!isPending && !isCancelled)
        {
            return (false, 409, "Only pending or cancelled events can be published.", null);
        }

        evt.Status = "Published";
        evt.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return (true, 200, null, await GetEventAsync(id, null, true));
    }

    public async Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> UnpublishEventAsync(Guid id)
    {
        var evt = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt is null)
        {
            return (false, 404, "Event was not found.", null);
        }

        if (!evt.Status.Equals("Published", StringComparison.OrdinalIgnoreCase))
        {
            return (false, 409, "Only published events can be unpublished.", null);
        }

        evt.Status = "Pending";
        evt.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync();

        return (true, 200, null, await GetEventAsync(id, null, true));
    }

    public async Task<bool> DeleteEventAsync(Guid id)
    {
        var evt = await dbContext.Events.FirstOrDefaultAsync(e => e.Id == id);
        if (evt is null)
        {
            return false;
        }

        dbContext.Events.Remove(evt);
        await dbContext.SaveChangesAsync();
        return true;
    }
}
