using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Persistence.Data;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HoaCommunityEvents.API.Tests;

public class ApiTestFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"HoaCommunityEvents_Test_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Seed:EnableBootstrap"] = "false",
                ["Seed:EnableDemoData"] = "false",
                ["Cloudinary:CloudName"] = "test-cloud",
                ["Cloudinary:ApiKey"] = "test-key",
                ["Cloudinary:ApiSecret"] = "test-secret"
            });
        });

        builder.ConfigureServices(services =>
        {
            var dbContextOptionsConfigurations = services
                .Where(d => d.ServiceType.IsGenericType
                            && d.ServiceType.GetGenericTypeDefinition() == typeof(IDbContextOptionsConfiguration<>))
                .ToList();

            foreach (var descriptor in dbContextOptionsConfigurations)
            {
                services.Remove(descriptor);
            }

            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();

            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });
            services.Configure<SecurityStampValidatorOptions>(options => options.ValidationInterval = TimeSpan.Zero);
        });
    }

    public HttpClient CreateCookieClient(bool handleCookies = true) => CreateClient(new WebApplicationFactoryClientOptions
    {
        AllowAutoRedirect = false,
        HandleCookies = handleCookies
    });

    public async Task<HttpRequestMessage> WithCsrfAsync(HttpClient client, HttpMethod method, string path, object? payload = null)
    {
        var csrfResponse = await client.GetAsync("/api/security/csrf");
        if (!csrfResponse.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(await csrfResponse.Content.ReadAsStringAsync());
        }
        var csrf = await csrfResponse.Content.ReadFromJsonAsync<CsrfTokenResponse>();
        var request = new HttpRequestMessage(method, path);
        request.Headers.Add("X-CSRF-TOKEN", csrf?.RequestToken ?? throw new InvalidOperationException("CSRF token was not returned."));
        if (payload is not null) request.Content = JsonContent.Create(payload);
        return request;
    }

    public async Task EnsureRolesAsync()
    {
        using var scope = Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        if (!await roleManager.RoleExistsAsync(AppRoles.Resident))
        {
            await roleManager.CreateAsync(new IdentityRole(AppRoles.Resident));
        }

        if (!await roleManager.RoleExistsAsync(AppRoles.HoaAdmin))
        {
            await roleManager.CreateAsync(new IdentityRole(AppRoles.HoaAdmin));
        }
    }

    public async Task CreateAdminUserAsync(string email, string username, string password, string displayName)
    {
        await EnsureRolesAsync();

        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            return;
        }

        var user = new AppUser
        {
            Email = email,
            UserName = username,
            DisplayName = displayName,
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Failed to create admin test user. {errors}");
        }

        await userManager.AddToRoleAsync(user, AppRoles.HoaAdmin);
    }

    public async Task DeleteUserAsync(string email)
    {
        using var scope = Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var user = await userManager.FindByEmailAsync(email) ?? throw new InvalidOperationException("Test user was not found.");
        var result = await userManager.DeleteAsync(user);
        if (!result.Succeeded) throw new InvalidOperationException("Test user could not be deleted.");
    }
}

public sealed class CsrfTokenResponse
{
    public string RequestToken { get; set; } = string.Empty;
}
