using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HoaCommunityEvents.API.Controllers;

[Authorize]
public class AttendanceController(IAttendanceService attendanceService) : BaseApiController
{
    [HttpPost("{eventId:guid}/join")]
    public async Task<ActionResult> JoinEvent(Guid eventId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        if (userId is null)
        {
            return ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.");
        }

        var result = await attendanceService.JoinEventAsync(eventId, userId);
        if (!result.Success)
        {
            return ApiError(result.StatusCode, "attendance_join_failed", result.Error ?? "Unable to join event.");
        }

        return Ok(new { attendeeCount = result.AttendeeCount });
    }

    [HttpDelete("{eventId:guid}/leave")]
    public async Task<ActionResult> LeaveEvent(Guid eventId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        if (userId is null)
        {
            return ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.");
        }

        var result = await attendanceService.LeaveEventAsync(eventId, userId);
        if (!result.Success)
        {
            return ApiError(result.StatusCode, "attendance_leave_failed", result.Error ?? "Unable to leave event.");
        }

        return Ok(new { attendeeCount = result.AttendeeCount });
    }

    [Authorize(Roles = AppRoles.HoaAdmin)]
    [HttpGet("{eventId:guid}")]
    public async Task<ActionResult<IReadOnlyList<AttendeeDto>>> GetAttendees(Guid eventId)
    {
        var attendees = await attendanceService.GetAttendeesAsync(eventId);
        return Ok(attendees);
    }
}
