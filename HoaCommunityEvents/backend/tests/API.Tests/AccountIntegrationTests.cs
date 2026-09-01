using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace HoaCommunityEvents.API.Tests;

public class AccountIntegrationTests(ApiTestFactory factory) : IClassFixture<ApiTestFactory>
{
    [Fact]
    public async Task Register_Current_AndLogout_UseCookieSessionWithoutTokenJson()
    {
        await factory.EnsureRolesAsync();
        using var client = factory.CreateCookieClient();
        var payload = NewRegistration("register");
        var register = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", payload));

        Assert.Equal(HttpStatusCode.Created, register.StatusCode);
        Assert.True(register.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, value => value.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase));
        using (var json = await ReadJsonAsync(register))
        {
            Assert.False(json.RootElement.TryGetProperty("token", out _));
            Assert.Equal("resident", GetString(json, "role"));
        }

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/account/current")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/logout"))).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/account/current")).StatusCode);
    }

    [Fact]
    public async Task Login_ReturnsCookieAndNoTokenJson()
    {
        await factory.EnsureRolesAsync();
        using var client = factory.CreateCookieClient();
        var payload = NewRegistration("login");
        Assert.Equal(HttpStatusCode.Created, (await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", payload))).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/logout"))).StatusCode);

        var login = await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/login", new { payload.email, payload.password }));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.True(login.Headers.TryGetValues("Set-Cookie", out var cookies));
        Assert.Contains(cookies, value => value.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase));
        using var json = await ReadJsonAsync(login);
        Assert.False(json.RootElement.TryGetProperty("token", out _));
        Assert.Equal(payload.email, GetString(json, "email", ignoreCase: true));
    }

    [Fact]
    public async Task ProtectedRequests_AnonymousReturn401WithoutRedirect_AndResidentGets403ForAdminEndpoint()
    {
        using var anonymous = factory.CreateCookieClient();
        var anonymousResponse = await anonymous.GetAsync("/api/account/current");
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);
        Assert.Null(anonymousResponse.Headers.Location);

        await factory.EnsureRolesAsync();
        using var resident = factory.CreateCookieClient();
        var payload = NewRegistration("resident");
        Assert.Equal(HttpStatusCode.Created, (await resident.SendAsync(await factory.WithCsrfAsync(resident, HttpMethod.Post, "/api/account/register", payload))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await resident.GetAsync("/api/account/users")).StatusCode);
    }

    [Fact]
    public async Task TamperedAuthenticationCookie_IsRejected()
    {
        await factory.EnsureRolesAsync();
        using var authenticated = factory.CreateCookieClient();
        var register = await authenticated.SendAsync(await factory.WithCsrfAsync(authenticated, HttpMethod.Post, "/api/account/register", NewRegistration("tampered")));
        var cookiePair = register.Headers.GetValues("Set-Cookie").First(value => value.Contains("HttpOnly", StringComparison.OrdinalIgnoreCase)).Split(';', 2)[0];
        var separator = cookiePair.IndexOf('=');

        using var tampered = factory.CreateCookieClient(handleCookies: false);
        tampered.DefaultRequestHeaders.Add("Cookie", $"{cookiePair[..(separator + 1)]}{cookiePair[(separator + 1)..]}x");
        Assert.Equal(HttpStatusCode.Unauthorized, (await tampered.GetAsync("/api/account/current")).StatusCode);
    }

    [Fact]
    public async Task UnsafeRequests_RequireValidCsrfTokenBeforeNormalValidationOrAuthorization()
    {
        using var client = factory.CreateCookieClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/account/register", NewRegistration("missing"))).StatusCode);

        var invalid = new HttpRequestMessage(HttpMethod.Post, "/api/account/register") { Content = JsonContent.Create(NewRegistration("invalid")) };
        invalid.Headers.Add("X-CSRF-TOKEN", "invalid");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(invalid)).StatusCode);

        Assert.Equal(HttpStatusCode.Created, (await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/account/register", NewRegistration("valid")))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(await factory.WithCsrfAsync(client, HttpMethod.Post, "/api/uploads/cloudinary/signature", new { scope = "invalid" }))).StatusCode);
    }

    private static RegistrationPayload NewRegistration(string prefix) => new(UniqueEmail(prefix), UniqueUserName(prefix), "Integration Test User", "Passw0rd!");
    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response) => JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    private static string GetString(JsonDocument json, string propertyName, bool ignoreCase = false) => !ignoreCase
        ? json.RootElement.GetProperty(propertyName).GetString() ?? string.Empty
        : json.RootElement.EnumerateObject().FirstOrDefault(property => string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase)).Value.GetString() ?? string.Empty;
    private static string UniqueEmail(string prefix) => $"{prefix}.{Guid.NewGuid():N}@example.com";
    private static string UniqueUserName(string prefix) => $"{prefix}_{Guid.NewGuid():N}"[..30];
    private sealed record RegistrationPayload(string email, string username, string displayName, string password);
}
