using System.Net.ServerSentEvents;
using System.Runtime.CompilerServices;
using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Common.Realtime;

namespace HoaCommunityEvents.API.Endpoints;

public static class EventStreamEndpoints
{
    public static IEndpointRouteBuilder MapEventStreamEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/events/{eventId:guid}/stream", (Guid eventId, HttpContext context, IEventUpdateSubscriber subscriber) =>
                TypedResults.ServerSentEvents(StreamUpdates(subscriber, eventId, context.RequestAborted)))
            .RequireAuthorization(AuthorizationPolicies.ResidentOrAdmin);

        return endpoints;
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
