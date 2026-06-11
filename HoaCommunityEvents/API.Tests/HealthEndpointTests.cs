using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class HealthEndpointTests : IClassFixture<HealthEndpointTests.ApiFactory>
{
    private readonly HttpClient _client;

    public HealthEndpointTests(ApiFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        var response = await _client.GetAsync("/health");

        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        Assert.Contains("\"status\":\"ok\"", content, StringComparison.OrdinalIgnoreCase);
    }

    public class ApiFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, configBuilder) =>
            {
                configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["TokenKey"] = "ThisIsASecureTestTokenKeyAtLeast64CharactersLong1234567890AbcDef",
                    ["Seed:EnableBootstrap"] = "false",
                    ["Seed:EnableDemoData"] = "false",
                    ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\MSSQLLocalDB;Database=HoaCommunityEvents_Test;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true"
                });
            });
        }
    }
}
