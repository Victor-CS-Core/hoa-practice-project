using Microsoft.AspNetCore.Hosting;
using System.Net;
using System.Text.Json;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public sealed class SpaHostingIntegrationTests : IDisposable
{
    private const string IndexMarker = "<main>HOA SPA test shell</main>";
    private readonly string _webRoot = Path.Combine(Path.GetTempPath(), $"hoa-spa-tests-{Guid.NewGuid():N}");
    private readonly SpaTestFactory _factory;

    public SpaHostingIntegrationTests()
    {
        Directory.CreateDirectory(_webRoot);
        File.WriteAllText(Path.Combine(_webRoot, "index.html"), IndexMarker);
        _factory = new SpaTestFactory(_webRoot);
    }

    [Fact]
    public async Task DeepSpaRoute_ReturnsIndexHtml()
    {
        using var client = _factory.CreateCookieClient();

        var response = await client.GetAsync("/events/42");

        response.EnsureSuccessStatusCode();
        Assert.Equal("text/html", response.Content.Headers.ContentType?.MediaType);
        Assert.Contains(IndexMarker, await response.Content.ReadAsStringAsync(), StringComparison.Ordinal);
    }

    [Fact]
    public async Task UnknownApiRoute_ReturnsJson404InsteadOfSpaHtml()
    {
        using var client = _factory.CreateCookieClient();

        var response = await client.GetAsync("/api/does-not-exist");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal("application/json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        Assert.DoesNotContain(IndexMarker, body, StringComparison.Ordinal);
        var error = JsonSerializer.Deserialize<ApiErrorContract>(body, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        Assert.Equal("not_found", error?.Code);
    }

    public void Dispose()
    {
        _factory.Dispose();
        if (Directory.Exists(_webRoot)) Directory.Delete(_webRoot, recursive: true);
    }

    private sealed class SpaTestFactory(string webRoot) : ApiTestFactory
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            base.ConfigureWebHost(builder);
            builder.UseWebRoot(webRoot);
        }
    }

    private sealed record ApiErrorContract(string Code);
}
