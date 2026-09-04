using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class EventsIntegrationTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task GetEvents_Anonymous_ReturnsPagedShape()
    {
        var response = await _client.GetAsync("/api/events?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.True(json.RootElement.TryGetProperty("items", out _));
        Assert.True(json.RootElement.TryGetProperty("totalCount", out _));
        Assert.True(json.RootElement.TryGetProperty("page", out _));
        Assert.True(json.RootElement.TryGetProperty("pageSize", out _));
    }

    [Fact]
    public async Task CreateEvent_AuthenticatedAdminRequiresCsrf_AndValidCsrfCreatesEvent()
    {
        var email = $"admin.{Guid.NewGuid():N}@example.com";
        const string password = "Passw0rd!";
        await factory.CreateAdminUserAsync(email, $"admin_{Guid.NewGuid():N}"[..30], password, "Admin Test User");
        using var admin = factory.CreateCookieClient();
        Assert.Equal(HttpStatusCode.OK, (await admin.SendAsync(await factory.WithCsrfAsync(admin, HttpMethod.Post, "/api/account/login", new { email, password }))).StatusCode);

        Assert.Equal(HttpStatusCode.BadRequest, (await admin.SendAsync(BuildJsonRequest(HttpMethod.Post, "/api/events", BuildCreateEventPayload("Missing CSRF event")))).StatusCode);
        var response = await admin.SendAsync(await factory.WithCsrfAsync(admin, HttpMethod.Post, "/api/events", BuildCreateEventPayload("Authorized event")));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task GetEvent_UnknownId_ReturnsNotFoundEnvelope()
    {
        var response = await _client.GetAsync($"/api/events/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("event_not_found", GetString(json, "code", ignoreCase: true));
    }

    private static object BuildCreateEventPayload(string title)
    {
        var start = DateTime.UtcNow.AddDays(2);
        var end = start.AddHours(2);

        return new
        {
            title,
            description = "Integration test event",
            category = "Testing",
            locationWithinCommunity = "Clubhouse",
            startDate = start,
            endDate = end,
            maxAttendees = 25,
            imageUrl = (string?)null,
            imagePositionX = 50,
            imagePositionY = 50,
            imageZoom = 1
        };
    }

    private static HttpRequestMessage BuildJsonRequest(HttpMethod method, string url, object payload)
    {
        var request = new HttpRequestMessage(method, url)
        {
            Content = JsonContent.Create(payload)
        };

        return request;
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var payload = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(payload);
    }

    private static string GetString(JsonDocument json, string propertyName, bool ignoreCase)
    {
        if (!ignoreCase)
        {
            return json.RootElement.GetProperty(propertyName).GetString() ?? string.Empty;
        }

        foreach (var property in json.RootElement.EnumerateObject())
        {
            if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
            {
                return property.Value.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }
}
