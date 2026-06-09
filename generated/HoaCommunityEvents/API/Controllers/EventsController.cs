using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HoaCommunityEvents.API.Controllers;

[AllowAnonymous]
public class EventsController(IEventService eventService) : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<EventDto>>> GetEvents([FromQuery] EventFilterDto filter)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var events = await eventService.GetEventsAsync(filter, currentUserId);
        return Ok(events);
    }

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
}
