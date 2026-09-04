using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IEventService
{
    Task<PagedResultDto<EventDto>> GetEventsAsync(EventFilterDto filter, string? currentUserId, bool isAdmin);
    Task<EventDto?> GetEventAsync(Guid id, string? currentUserId, bool isAdmin);
    Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> CreateEventAsync(CreateEventDto dto, string hostUserId, bool canCreateInPast);
    Task<EventDto?> EditEventAsync(Guid id, EditEventDto dto, string hostUserId);
    Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> CancelEventAsync(Guid id);
    Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> PublishEventAsync(Guid id);
    Task<(bool Success, int StatusCode, string? Error, EventDto? Event)> UnpublishEventAsync(Guid id);
    Task<bool> DeleteEventAsync(Guid id);
}
