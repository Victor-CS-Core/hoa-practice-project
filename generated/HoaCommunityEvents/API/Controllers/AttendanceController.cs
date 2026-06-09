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
            return Unauthorized();
        }

        var result = await attendanceService.JoinEventAsync(eventId, userId);
        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new { error = result.Error });
        }

        return Ok(new { attendeeCount = result.AttendeeCount });
    }

    [HttpDelete("{eventId:guid}/leave")]
    public async Task<ActionResult> LeaveEvent(Guid eventId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        if (userId is null)
        {
            return Unauthorized();
        }

        var result = await attendanceService.LeaveEventAsync(eventId, userId);
        if (!result.Success)
        {
            return StatusCode(result.StatusCode, new { error = result.Error });
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
