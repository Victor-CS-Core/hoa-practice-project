using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class HealthEndpointTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");

        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"ok\"", content, StringComparison.OrdinalIgnoreCase);
    }
}
