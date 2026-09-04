using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Domain.Common;

namespace HoaCommunityEvents.API.Endpoints;

public static class EventStreamEndpoints
{
    public static IEndpointRouteBuilder MapEventStreamEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/events/{eventId:guid}/stream", OpenStreamAsync)
            .RequireAuthorization(AuthorizationPolicies.ResidentOrAdmin);

        return endpoints;
    }

    private static async Task<IResult> OpenStreamAsync(
        Guid eventId,
        HttpContext context,
        IEventUpdateSubscriber subscriber,
        IEventService eventService)
    {
        var currentUserId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = context.User.IsInRole(AppRoles.HoaAdmin);
        if (await eventService.GetEventAsync(eventId, currentUserId, isAdmin) is null)
        {
            return Results.Json(
                new { code = "event_not_found", message = "Event was not found." },
                statusCode: StatusCodes.Status404NotFound);
        }

        return TypedResults.ServerSentEvents(StreamUpdates(subscriber, eventId, context.RequestAborted));
    }

    private static async IAsyncEnumerable<SseItem<EventUpdate>> StreamUpdates(
        IEventUpdateSubscriber subscriber,
        Guid eventId,
        [EnumeratorCancellation] CancellationToken cancellationToken)
    {
        await foreach (var update in subscriber.SubscribeAsync(eventId, cancellationToken).WithCancellation(cancellationToken))
        {
            yield return new SseItem<EventUpdate>(update, update.EventName);
        }
    }
}
