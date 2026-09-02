using System.Net;
using System.Net.Http.Json;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Infrastructure.Realtime;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class AttendanceRealtimeIntegrationTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    [Fact]
    public async Task PersistedJoinAndLeave_EmitAttendanceChangedUpdates()
    {
        using var client = await CreateResidentClientAsync();
        var eventId = await CreatePublishedEventAsync();
        var broker = factory.Services.GetRequiredService<InMemoryEventUpdateBroker>();
        using var cancellation = new CancellationTokenSource();
        await using var subscription = broker.SubscribeAsync(eventId, cancellation.Token).GetAsyncEnumerator();

        var joinUpdate = subscription.MoveNextAsync().AsTask();
        var joinResponse = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, $"/api/attendance/{eventId}/join"));

        Assert.Equal(HttpStatusCode.OK, joinResponse.StatusCode);
        Assert.Equal(1, await AttendanceCountAsync(eventId));
        Assert.True(await WaitForUpdateAsync(joinUpdate, cancellation));
        Assert.Equal(new EventUpdate(eventId, "attendance-changed"), subscription.Current);

        var leaveUpdate = subscription.MoveNextAsync().AsTask();
        var leaveResponse = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Delete, $"/api/attendance/{eventId}/leave"));

        Assert.Equal(HttpStatusCode.OK, leaveResponse.StatusCode);
        Assert.Equal(0, await AttendanceCountAsync(eventId));
        Assert.True(await WaitForUpdateAsync(leaveUpdate, cancellation));
        Assert.Equal(new EventUpdate(eventId, "attendance-changed"), subscription.Current);
    }

    [Fact]
    public async Task RejectedJoin_DoesNotEmitAttendanceChangedUpdate()
    {
        using var client = await CreateResidentClientAsync();
        var eventId = Guid.NewGuid();
        var broker = factory.Services.GetRequiredService<InMemoryEventUpdateBroker>();
        using var cancellation = new CancellationTokenSource();
        await using var subscription = broker.SubscribeAsync(eventId, cancellation.Token).GetAsyncEnumerator();
        var update = subscription.MoveNextAsync().AsTask();

        var response = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, $"/api/attendance/{eventId}/join"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        await Assert.ThrowsAsync<TimeoutException>(async () => await update.WaitAsync(TimeSpan.FromMilliseconds(200)));

        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await update);
    }

    private async Task<HttpClient> CreateResidentClientAsync()
    {
        await factory.EnsureRolesAsync();
        var client = factory.CreateCookieClient();
        var registration = new
        {
            email = $"attendance.{Guid.NewGuid():N}@example.com",
            username = $"attendance_{Guid.NewGuid():N}"[..30],
            displayName = "Attendance Test User",
            password = "Passw0rd!"
        };
        var response = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", registration));
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return client;
    }

    private async Task<Guid> CreatePublishedEventAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var eventId = Guid.NewGuid();
        dbContext.Events.Add(new Event
        {
            Id = eventId,
            Title = "Attendance stream test",
            Description = "Event used to verify attendance updates.",
            Category = "Testing",
            LocationWithinCommunity = "Clubhouse",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            HostUserId = "test-host",
            Status = "Published"
        });
        await dbContext.SaveChangesAsync();
        return eventId;
    }

    private async Task<int> AttendanceCountAsync(Guid eventId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await dbContext.EventAttendances.CountAsync(attendance => attendance.EventId == eventId);
    }

    private static async Task<bool> WaitForUpdateAsync(Task<bool> update, CancellationTokenSource cancellation)
    {
        if (await Task.WhenAny(update, Task.Delay(TimeSpan.FromSeconds(1))) == update)
        {
            return await update;
        }

        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(async () => await update);
        throw new Xunit.Sdk.XunitException("Expected the attendance operation to publish an event update.");
    }
}
