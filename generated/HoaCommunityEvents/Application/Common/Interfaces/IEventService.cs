using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IEventService
{
    Task<IReadOnlyList<EventDto>> GetEventsAsync(EventFilterDto filter, string? currentUserId);
    Task<EventDto?> GetEventAsync(Guid id, string? currentUserId);
}
