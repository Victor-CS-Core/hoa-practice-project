using System.Collections.Concurrent;
using System.Threading.Channels;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Common.Realtime;

namespace HoaCommunityEvents.Infrastructure.Realtime;

public sealed class InMemoryEventUpdateBroker : IEventUpdatePublisher, IEventUpdateSubscriber
{
    private readonly ConcurrentDictionary<Guid, ConcurrentDictionary<Guid, Channel<EventUpdate>>> _subscriptions = new();

    internal int SubscriptionCount => _subscriptions.Values.Sum(static subscriptions => subscriptions.Count);

    public Task PublishAsync(EventUpdate update)
    {
        if (!_subscriptions.TryGetValue(update.EventId, out var subscriptions))
        {
            return Task.CompletedTask;
        }

        foreach (var subscription in subscriptions.Values)
        {
            subscription.Writer.TryWrite(update);
        }

        return Task.CompletedTask;
    }

    public async IAsyncEnumerable<EventUpdate> SubscribeAsync(Guid eventId, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var channel = Channel.CreateBounded<EventUpdate>(new BoundedChannelOptions(1)
        {
            FullMode = BoundedChannelFullMode.DropOldest,
            SingleReader = true,
            SingleWriter = false
        });
        var subscriptionId = Guid.NewGuid();
        var subscriptions = _subscriptions.GetOrAdd(eventId, _ => new());
        subscriptions[subscriptionId] = channel;

        try
        {
            await foreach (var update in channel.Reader.ReadAllAsync(cancellationToken))
            {
                yield return update;
            }
        }
        finally
        {
            subscriptions.TryRemove(subscriptionId, out _);
            channel.Writer.TryComplete();

            if (subscriptions.IsEmpty)
            {
                _subscriptions.TryRemove(new KeyValuePair<Guid, ConcurrentDictionary<Guid, Channel<EventUpdate>>>(eventId, subscriptions));
            }
        }
    }
}
