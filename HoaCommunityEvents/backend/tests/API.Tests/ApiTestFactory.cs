using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HoaCommunityEvents.API.Tests;

public sealed class ApiTestFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"HoaCommunityEvents_Test_{Guid.NewGuid():N}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["TokenKey"] = "ThisIsASecureTestTokenKeyAtLeast64CharactersLong1234567890AbcDef",
                ["Seed:EnableBootstrap"] = "false",
                ["Seed:EnableDemoData"] = "false"
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
        });
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
}
