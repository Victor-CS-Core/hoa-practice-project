using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IEventService
{
    Task<PagedResultDto<EventDto>> GetEventsAsync(EventFilterDto filter, string? currentUserId);
    Task<EventDto?> GetEventAsync(Guid id, string? currentUserId);
    Task<EventDto> CreateEventAsync(CreateEventDto dto, string hostUserId);
    Task<EventDto?> EditEventAsync(Guid id, EditEventDto dto, string hostUserId);
    Task<EventDto?> CancelEventAsync(Guid id);
    Task<bool> DeleteEventAsync(Guid id);
}
