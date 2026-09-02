using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using HoaCommunityEvents.Application.Common.Realtime;
using HoaCommunityEvents.Infrastructure.Realtime;
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

        var eventId = Guid.NewGuid();
        using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(10));
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/events/{eventId}/stream");
        var broker = factory.Services.GetRequiredService<InMemoryEventUpdateBroker>();
        var streamResponse = client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellation.Token);
        await WaitUntilAsync(() => broker.SubscriptionCount == 1, cancellation.Token);
        await broker.PublishAsync(new EventUpdate(eventId, "attendance-changed"));

        using var response = await streamResponse;
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/event-stream", response.Content.Headers.ContentType?.MediaType);

        await using var stream = await response.Content.ReadAsStreamAsync(cancellation.Token);
        using var reader = new StreamReader(stream);
        var eventLine = await reader.ReadLineAsync(cancellation.Token);
        var dataLine = await reader.ReadLineAsync(cancellation.Token);

        Assert.Equal("event: attendance-changed", eventLine);
        Assert.NotNull(dataLine);
        Assert.StartsWith("data: ", dataLine, StringComparison.Ordinal);

        using var json = JsonDocument.Parse(dataLine["data: ".Length..]);
        Assert.Equal(eventId, json.RootElement.GetProperty("eventId").GetGuid());
        Assert.Equal("attendance-changed", json.RootElement.GetProperty("eventName").GetString());
    }

    private static async Task WaitUntilAsync(Func<bool> condition, CancellationToken cancellationToken)
    {
        while (!condition())
        {
            await Task.Delay(25, cancellationToken);
        }
    }

    private static RegistrationPayload NewRegistration() => new(
        $"stream.{Guid.NewGuid():N}@example.com",
        $"stream_{Guid.NewGuid():N}"[..30],
        "Stream Test User",
        "Passw0rd!");

    private sealed record RegistrationPayload(string email, string username, string displayName, string password);
}
