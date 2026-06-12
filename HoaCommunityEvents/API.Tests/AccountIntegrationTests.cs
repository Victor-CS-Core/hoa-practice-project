using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class AccountIntegrationTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Register_ValidPayload_ReturnsCreatedUserWithToken()
    {
        await factory.EnsureRolesAsync();

        var payload = new
        {
            email = UniqueEmail("register"),
            username = UniqueUserName("register"),
            displayName = "Register Test User",
            password = "Passw0rd!"
        };

        var response = await _client.PostAsJsonAsync("/api/account/register", payload);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("resident", GetString(json, "role"));
        Assert.False(string.IsNullOrWhiteSpace(GetString(json, "token")));
        Assert.Equal(payload.email, GetString(json, "email"), ignoreCase: true);
    }

    [Fact]
    public async Task Login_AfterRegister_ReturnsOkWithToken()
    {
        await factory.EnsureRolesAsync();

        var email = UniqueEmail("login");
        var password = "Passw0rd!";

        await RegisterAsync(email, UniqueUserName("login"), "Login Test User", password);

        var response = await _client.PostAsJsonAsync("/api/account/login", new
        {
            email,
            password
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.False(string.IsNullOrWhiteSpace(GetString(json, "token")));
        Assert.Equal(email, GetString(json, "email"), ignoreCase: true);
    }

    [Fact]
    public async Task Current_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync("/api/account/current");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Register_InvalidPayload_ReturnsValidationFailed()
    {
        var response = await _client.PostAsJsonAsync("/api/account/register", new
        {
            email = string.Empty,
            username = string.Empty,
            displayName = string.Empty,
            password = string.Empty
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("validation_failed", GetString(json, "code", ignoreCase: true));
        Assert.True(json.RootElement.TryGetProperty("details", out _));
    }

    [Fact]
    public async Task Login_InvalidCredentials_ReturnsUnauthorizedEnvelope()
    {
        var response = await _client.PostAsJsonAsync("/api/account/login", new
        {
            email = "does-not-exist@example.com",
            password = "WrongPass1!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        Assert.Equal("invalid_credentials", GetString(json, "code", ignoreCase: true));
    }

    private async Task RegisterAsync(string email, string username, string displayName, string password)
    {
        var registerResponse = await _client.PostAsJsonAsync("/api/account/register", new
        {
            email,
            username,
            displayName,
            password
        });

        Assert.Equal(HttpStatusCode.Created, registerResponse.StatusCode);
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var payload = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(payload);
    }

    private static string GetString(JsonDocument json, string propertyName)
    {
        return GetString(json, propertyName, ignoreCase: false);
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

    private static string UniqueEmail(string prefix)
    {
        return $"{prefix}.{Guid.NewGuid():N}@example.com";
    }

    private static string UniqueUserName(string prefix)
    {
        var suffix = Guid.NewGuid().ToString("N")[..8];
        return $"{prefix}_{suffix}";
    }
}
