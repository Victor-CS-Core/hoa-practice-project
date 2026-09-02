using HoaCommunityEvents.Application.Common.Realtime;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IEventUpdateSubscriber
{
    IAsyncEnumerable<EventUpdate> SubscribeAsync(Guid eventId, CancellationToken cancellationToken = default);
}
