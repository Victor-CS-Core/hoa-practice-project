using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Infrastructure.Realtime;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class EventStreamIntegrationTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    [Fact]
    public async Task Stream_Anonymous_ReturnsUnauthorized()
    {
        using var client = factory.CreateCookieClient();

        var response = await client.GetAsync($"/api/events/{Guid.NewGuid()}/stream");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Stream_Authenticated_EmitsAttendanceChangedForRequestedEvent()
    {
        await factory.EnsureRolesAsync();
        using var client = factory.CreateCookieClient();
        var registration = NewRegistration();
        var registrationResponse = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", registration));
        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var eventId = await CreatePublishedEventAsync(registration.email);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync($"/api/events/{eventId}")).StatusCode);
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var request = new HttpRequestMessage(HttpMethod.Get, $"/api/events/{eventId}/stream");
        var broker = factory.Services.GetRequiredService<InMemoryEventUpdateBroker>();
        var subscriptionBaseline = broker.SubscriptionCount;
        var streamResponse = client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellation.Token);
        HttpResponseMessage? response = null;
        Stream? stream = null;
        StreamReader? reader = null;

        try
        {
            await WaitUntilAsync(() => broker.SubscriptionCount == subscriptionBaseline + 1, cancellation.Token);
            await broker.PublishAsync(new EventUpdate(eventId, "attendance-changed"));

            response = await streamResponse;
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal("text/event-stream", response.Content.Headers.ContentType?.MediaType);

            stream = await response.Content.ReadAsStreamAsync(cancellation.Token);
            reader = new StreamReader(stream, leaveOpen: true);
            var eventLine = await reader.ReadLineAsync(cancellation.Token);
            var dataLine = await reader.ReadLineAsync(cancellation.Token);

            Assert.Equal("event: attendance-changed", eventLine);
            Assert.NotNull(dataLine);
            Assert.StartsWith("data: ", dataLine, StringComparison.Ordinal);

            using var json = JsonDocument.Parse(dataLine["data: ".Length..]);
            Assert.Equal(eventId, json.RootElement.GetProperty("eventId").GetGuid());
            Assert.Equal("attendance-changed", json.RootElement.GetProperty("eventName").GetString());
        }
        finally
        {
            cancellation.Cancel();

            if (response is null)
            {
                try
                {
                    response = await streamResponse.WaitAsync(TimeSpan.FromSeconds(1));
                }
                catch (OperationCanceledException)
                {
                }
                catch (TimeoutException)
                {
                }
            }

            reader?.Dispose();
            if (stream is not null)
            {
                await stream.DisposeAsync();
            }
            response?.Dispose();
            request.Dispose();

            using var cleanupTimeout = new CancellationTokenSource(TimeSpan.FromSeconds(1));
            await WaitUntilAsync(() => broker.SubscriptionCount == subscriptionBaseline, cleanupTimeout.Token);
            Assert.Equal(subscriptionBaseline, broker.SubscriptionCount);
        }
    }

    [Fact]
    public async Task Stream_AuthenticatedUnknownEvent_ReturnsNotFoundWithoutSubscribing()
    {
        await factory.EnsureRolesAsync();
        using var client = factory.CreateCookieClient();
        var registration = NewRegistration();
        var registrationResponse = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", registration));
        Assert.Equal(HttpStatusCode.Created, registrationResponse.StatusCode);

        var eventId = Guid.NewGuid();
        var broker = factory.Services.GetRequiredService<InMemoryEventUpdateBroker>();
        var subscriptionBaseline = broker.SubscriptionCount;
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        var responseTask = client.SendAsync(
            new HttpRequestMessage(HttpMethod.Get, $"/api/events/{eventId}/stream"),
            HttpCompletionOption.ResponseHeadersRead,
            cancellation.Token);

        while (!responseTask.IsCompleted && broker.SubscriptionCount == subscriptionBaseline)
        {
            await Task.Delay(25, cancellation.Token);
        }
        if (broker.SubscriptionCount == subscriptionBaseline + 1)
        {
            await broker.PublishAsync(new EventUpdate(eventId, "attendance-changed"));
        }
        using var response = await responseTask;

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(subscriptionBaseline, broker.SubscriptionCount);
    }

    private static async Task WaitUntilAsync(Func<bool> condition, CancellationToken cancellationToken)
    {
        while (!condition())
        {
            await Task.Delay(25, cancellationToken);
        }
    }

    private async Task<Guid> CreatePublishedEventAsync(string hostEmail)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hostUserId = dbContext.Users.Single(user => user.Email == hostEmail).Id;
        var eventId = Guid.NewGuid();
        dbContext.Events.Add(new Event
        {
            Id = eventId,
            Title = "Event stream test",
            Description = "Published event used to verify its SSE stream.",
            Category = "Testing",
            LocationWithinCommunity = "Clubhouse",
            StartDate = DateTime.UtcNow.AddDays(1),
            EndDate = DateTime.UtcNow.AddDays(1).AddHours(1),
            HostUserId = hostUserId,
            Status = "Published"
        });
        await dbContext.SaveChangesAsync();
        return eventId;
    }

    private static RegistrationPayload NewRegistration() => new(
        $"stream.{Guid.NewGuid():N}@example.com",
        $"stream_{Guid.NewGuid():N}"[..30],
        "Stream Test User",
        "Passw0rd!");

    private sealed record RegistrationPayload(string email, string username, string displayName, string password);
}
