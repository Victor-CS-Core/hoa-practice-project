using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HoaCommunityEvents.API.Controllers;

public class EventsController(IEventService eventService) : BaseApiController
{
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetEvents([FromQuery] EventFilterDto filter)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var events = await eventService.GetEventsAsync(filter, currentUserId);
        return Ok(events);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDto>> GetEvent(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var evt = await eventService.GetEventAsync(id, currentUserId);
        if (evt is null)
        {
            return NotFound();
        }

        return Ok(evt);
    }

    [Authorize(Roles = AppRoles.HoaAdmin)]
    [HttpPost]
    public async Task<ActionResult<EventDto>> CreateEvent(CreateEventDto dto)
    {
        var hostUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (hostUserId is null)
        {
            return Unauthorized();
        }

        var created = await eventService.CreateEventAsync(dto, hostUserId);
        return CreatedAtAction(nameof(GetEvent), new { id = created.Id }, created);
    }

    [Authorize(Roles = AppRoles.HoaAdmin)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDto>> EditEvent(Guid id, EditEventDto dto)
    {
        var hostUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (hostUserId is null)
        {
            return Unauthorized();
        }

        var updated = await eventService.EditEventAsync(id, dto, hostUserId);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [Authorize(Roles = AppRoles.HoaAdmin)]
    [HttpPatch("{id:guid}/cancel")]
    public async Task<ActionResult<EventDto>> CancelEvent(Guid id)
    {
        var updated = await eventService.CancelEventAsync(id);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [Authorize(Roles = AppRoles.HoaAdmin)]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteEvent(Guid id)
    {
        var deleted = await eventService.DeleteEventAsync(id);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}
