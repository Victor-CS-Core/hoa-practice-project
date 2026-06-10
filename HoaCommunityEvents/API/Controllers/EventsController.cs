using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace HoaCommunityEvents.API.Controllers;

public class EventsController(IEventService eventService, UserManager<AppUser> userManager) : BaseApiController
{
    private const string MasterAdminClaimType = "is_master_admin";

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<EventDto>>> GetEvents([FromQuery] EventFilterDto filter)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(AppRoles.HoaAdmin);
        var events = await eventService.GetEventsAsync(filter, currentUserId, isAdmin);
        return Ok(events);
    }

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<EventDto>> GetEvent(Guid id)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(AppRoles.HoaAdmin);
        var evt = await eventService.GetEventAsync(id, currentUserId, isAdmin);
        if (evt is null)
        {
            return ApiError(StatusCodes.Status404NotFound, "event_not_found", "Event was not found.");
        }

        return Ok(evt);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost]
    public async Task<ActionResult<EventDto>> CreateEvent(CreateEventDto dto)
    {
        var hostUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (hostUserId is null)
        {
            return ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.");
        }

        var currentUser = await userManager.GetUserAsync(User);
        if (currentUser is null)
        {
            return ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.");
        }

        var canCreateInPast = await IsMasterAdminAsync(currentUser);
        var result = await eventService.CreateEventAsync(dto, hostUserId, canCreateInPast);
        if (!result.Success || result.Event is null)
        {
            return ApiError(result.StatusCode, "event_create_failed", result.Error ?? "Failed to create event.");
        }

        return CreatedAtAction(nameof(GetEvent), new { id = result.Event.Id }, result.Event);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<EventDto>> EditEvent(Guid id, EditEventDto dto)
    {
        var hostUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (hostUserId is null)
        {
            return ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.");
        }

        var updated = await eventService.EditEventAsync(id, dto, hostUserId);
        if (updated is null)
        {
            return ApiError(StatusCodes.Status404NotFound, "event_not_found", "Event was not found.");
        }

        return Ok(updated);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPatch("{id:guid}/cancel")]
    public async Task<ActionResult<EventDto>> CancelEvent(Guid id)
    {
        var result = await eventService.CancelEventAsync(id);
        if (!result.Success || result.Event is null)
        {
            return ApiError(result.StatusCode, "event_cancel_failed", result.Error ?? "Failed to cancel event.");
        }

        return Ok(result.Event);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPatch("{id:guid}/publish")]
    public async Task<ActionResult<EventDto>> PublishEvent(Guid id)
    {
        var result = await eventService.PublishEventAsync(id);
        if (!result.Success || result.Event is null)
        {
            return ApiError(result.StatusCode, "event_publish_failed", result.Error ?? "Failed to publish event.");
        }

        return Ok(result.Event);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPatch("{id:guid}/unpublish")]
    public async Task<ActionResult<EventDto>> UnpublishEvent(Guid id)
    {
        var result = await eventService.UnpublishEventAsync(id);
        if (!result.Success || result.Event is null)
        {
            return ApiError(result.StatusCode, "event_unpublish_failed", result.Error ?? "Failed to unpublish event.");
        }

        return Ok(result.Event);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteEvent(Guid id)
    {
        var deleted = await eventService.DeleteEventAsync(id);
        if (!deleted)
        {
            return ApiError(StatusCodes.Status404NotFound, "event_not_found", "Event was not found.");
        }

        return NoContent();
    }

    private async Task<bool> IsMasterAdminAsync(AppUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);
        return claims.Any(c =>
            c.Type == MasterAdminClaimType
            && string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase));
    }
}
