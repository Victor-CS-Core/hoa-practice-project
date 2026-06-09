using HoaCommunityEvents.Application.DTOs;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IAttendanceService
{
    Task<(bool Success, int StatusCode, string? Error, int AttendeeCount)> JoinEventAsync(Guid eventId, string userId);
    Task<(bool Success, int StatusCode, string? Error, int AttendeeCount)> LeaveEventAsync(Guid eventId, string userId);
    Task<IReadOnlyList<AttendeeDto>> GetAttendeesAsync(Guid eventId);
}
