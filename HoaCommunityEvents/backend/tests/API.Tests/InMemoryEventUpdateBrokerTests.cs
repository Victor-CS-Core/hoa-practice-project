using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Infrastructure.Realtime;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class InMemoryEventUpdateBrokerTests
{
    [Fact]
    public async Task PublishAsync_DeliversUpdateToEachCurrentSubscriberForSameEvent()
    {
        var broker = new InMemoryEventUpdateBroker();
        var eventId = Guid.NewGuid();
        var update = new EventUpdate(eventId, "attendance-changed");

        await using var firstSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
        await using var secondSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
        var firstRead = firstSubscriber.MoveNextAsync().AsTask();
        var secondRead = secondSubscriber.MoveNextAsync().AsTask();

        await broker.PublishAsync(update);

        Assert.True(await firstRead.WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.Equal(update, firstSubscriber.Current);
        Assert.True(await secondRead.WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.Equal(update, secondSubscriber.Current);
    }

    [Fact]
    public async Task PublishAsync_DoesNotDeliverUpdateToSubscriberForDifferentEvent()
    {
        var broker = new InMemoryEventUpdateBroker();
        var eventId = Guid.NewGuid();
        var otherEventId = Guid.NewGuid();
        var update = new EventUpdate(eventId, "attendance-changed");
        using var cancellation = new CancellationTokenSource();

        await using var matchingSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
        await using var otherSubscriber = broker.SubscribeAsync(otherEventId, cancellation.Token).GetAsyncEnumerator();
        var matchingRead = matchingSubscriber.MoveNextAsync().AsTask();
        var otherRead = otherSubscriber.MoveNextAsync().AsTask();

        await broker.PublishAsync(update);

        Assert.True(await matchingRead.WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.Equal(update, matchingSubscriber.Current);
        await Assert.ThrowsAsync<TimeoutException>(async () => await otherRead.WaitAsync(TimeSpan.FromMilliseconds(200)));

        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await otherRead);
    }

    [Fact]
    public async Task SubscribeAsync_CancellationRemovesSubscription()
    {
        var broker = new InMemoryEventUpdateBroker();
        using var cancellation = new CancellationTokenSource();
        await using var subscriber = broker.SubscribeAsync(Guid.NewGuid(), cancellation.Token).GetAsyncEnumerator();
        var read = subscriber.MoveNextAsync().AsTask();

        Assert.Equal(1, broker.SubscriptionCount);

        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await read);
        Assert.Equal(0, broker.SubscriptionCount);
    }

    [Fact]
    public async Task SubscribeAsync_ConcurrentCleanupKeepsNewSameEventSubscriberReachable()
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            var broker = new InMemoryEventUpdateBroker();
            var eventId = Guid.NewGuid();
            using var cancellation = new CancellationTokenSource();
            var removingSubscriber = broker.SubscribeAsync(eventId, cancellation.Token).GetAsyncEnumerator();
            var removingRead = removingSubscriber.MoveNextAsync().AsTask();

            Assert.Equal(1, broker.SubscriptionCount);

            var cancellationTask = Task.Run(cancellation.Cancel);
            var survivingSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
            var survivingRead = survivingSubscriber.MoveNextAsync().AsTask();

            await cancellationTask;
            await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await removingRead);
            await removingSubscriber.DisposeAsync();

            var update = new EventUpdate(eventId, "attendance-changed");
            await broker.PublishAsync(update);

            Assert.True(await survivingRead.WaitAsync(TimeSpan.FromSeconds(1)));
            Assert.Equal(update, survivingSubscriber.Current);
            await survivingSubscriber.DisposeAsync();
            Assert.Equal(0, broker.SubscriptionCount);
        }
    }

    [Fact]
    public async Task SubscribeAsync_NormalDisposalRemovesOnlyDisposedSubscriber()
    {
        var broker = new InMemoryEventUpdateBroker();
        var eventId = Guid.NewGuid();
        var firstSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
        var secondSubscriber = broker.SubscribeAsync(eventId).GetAsyncEnumerator();
        var firstRead = firstSubscriber.MoveNextAsync().AsTask();
        var secondRead = secondSubscriber.MoveNextAsync().AsTask();

        await broker.PublishAsync(new EventUpdate(eventId, "priming"));
        Assert.True(await firstRead.WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.True(await secondRead.WaitAsync(TimeSpan.FromSeconds(1)));

        await firstSubscriber.DisposeAsync();
        Assert.Equal(1, broker.SubscriptionCount);

        var secondNextRead = secondSubscriber.MoveNextAsync().AsTask();
        var update = new EventUpdate(eventId, "attendance-changed");
        await broker.PublishAsync(update);

        Assert.True(await secondNextRead.WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.Equal(update, secondSubscriber.Current);
        await secondSubscriber.DisposeAsync();
        Assert.Equal(0, broker.SubscriptionCount);
    }

    [Fact]
    public async Task PublishAsync_DoesNotBlockWithUnreadSubscriberAndKeepsLatestUpdate()
    {
        var broker = new InMemoryEventUpdateBroker();
        var eventId = Guid.NewGuid();
        using var cancellation = new CancellationTokenSource();
        await using var subscriber = broker.SubscribeAsync(eventId, cancellation.Token).GetAsyncEnumerator();
        var firstRead = subscriber.MoveNextAsync().AsTask();

        await broker.PublishAsync(new EventUpdate(eventId, "update-0"));
        Assert.True(await firstRead.WaitAsync(TimeSpan.FromSeconds(1)));

        var publishes = Task.WhenAll(Enumerable.Range(1, 100)
            .Select(index => broker.PublishAsync(new EventUpdate(eventId, $"update-{index}"))));
        await publishes.WaitAsync(TimeSpan.FromSeconds(1));

        Assert.True(await subscriber.MoveNextAsync().AsTask().WaitAsync(TimeSpan.FromSeconds(1)));
        Assert.Equal("update-100", subscriber.Current.EventName);

        cancellation.Cancel();
    }

    [Fact]
    public void AddApplicationServices_ResolvesBothRealtimeContractsFromOneBroker()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
        using var provider = builder.Services.BuildServiceProvider();

        var broker = provider.GetRequiredService<InMemoryEventUpdateBroker>();

        Assert.Same(broker, provider.GetRequiredService<IEventUpdatePublisher>());
        Assert.Same(broker, provider.GetRequiredService<IEventUpdateSubscriber>());
    }
}
