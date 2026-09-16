using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using System.Text;

namespace HoaCommunityEvents.Persistence.Data;

public static class SeedData
{
    private const string MasterAdminClaimType = "is_master_admin";

    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

        var roles = new[] { AppRoles.Resident, AppRoles.HoaAdmin };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var adminEmail = GetRequiredSetting(configuration, "AdminSeed:Email");
        var adminUserName = GetRequiredSetting(configuration, "AdminSeed:Username");
        var adminPassword = GetRequiredSetting(configuration, "AdminSeed:Password");
        var adminDisplayName = GetRequiredSetting(configuration, "AdminSeed:DisplayName");

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        AppUser adminUser;

        if (existingAdmin is null)
        {
            adminUser = new AppUser
            {
                Email = adminEmail,
                UserName = adminUserName,
                DisplayName = adminDisplayName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var createAdmin = await userManager.CreateAsync(adminUser, adminPassword);
            if (!createAdmin.Succeeded)
            {
                throw new InvalidOperationException(BuildIdentityErrors(
                    "Could not create seeded admin user.",
                    createAdmin.Errors));
            }

            await userManager.AddToRoleAsync(adminUser, AppRoles.HoaAdmin);
            await EnsureMasterAdminClaimAsync(userManager, adminUser);
        }
        else
        {
            adminUser = existingAdmin;
            adminUser.UserName = adminUserName;
            adminUser.DisplayName = adminDisplayName;
            adminUser.EmailConfirmed = true;

            var updateAdmin = await userManager.UpdateAsync(adminUser);
            if (!updateAdmin.Succeeded)
            {
                throw new InvalidOperationException(BuildIdentityErrors(
                    "Could not update seeded admin user.",
                    updateAdmin.Errors));
            }

            var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
            var resetPassword = await userManager.ResetPasswordAsync(adminUser, resetToken, adminPassword);
            if (!resetPassword.Succeeded)
            {
                throw new InvalidOperationException(BuildIdentityErrors(
                    "Could not reset seeded admin password.",
                    resetPassword.Errors));
            }

            if (!await userManager.IsInRoleAsync(existingAdmin, AppRoles.HoaAdmin))
            {
                await userManager.AddToRoleAsync(existingAdmin, AppRoles.HoaAdmin);
            }

            if (await userManager.IsInRoleAsync(existingAdmin, AppRoles.Resident))
            {
                await userManager.RemoveFromRoleAsync(existingAdmin, AppRoles.Resident);
            }

            await EnsureMasterAdminClaimAsync(userManager, existingAdmin);
        }
    }

    public static async Task SeedDemoEventsAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

        if (dbContext.Events.Any())
        {
            return;
        }

        var adminEmail = GetRequiredSetting(configuration, "AdminSeed:Email");
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser is null)
        {
            throw new InvalidOperationException(
                "Demo event seed requires an existing admin user. Run bootstrap seed first.");
        }

        var now = DateTime.UtcNow;
        dbContext.Events.AddRange(
            new Event
            {
                Title = "Community Pool Opening",
                Description = "Kick-off event for summer pool season.",
                Category = "Pool Event",
                LocationWithinCommunity = "Pool Deck",
                StartDate = now.AddDays(3),
                EndDate = now.AddDays(3).AddHours(2),
                HostUserId = adminUser.Id,
                Status = "Published"
            },
            new Event
            {
                Title = "Neighborhood Cleanup",
                Description = "Volunteer cleanup around common areas.",
                Category = "Community Cleanup",
                LocationWithinCommunity = "Main Entrance",
                StartDate = now.AddDays(7),
                EndDate = now.AddDays(7).AddHours(3),
                HostUserId = adminUser.Id,
                Status = "Published"
            },
            new Event
            {
                Title = "Monthly Board Meeting",
                Description = "Open HOA board meeting with Q and A.",
                Category = "Board Meeting",
                LocationWithinCommunity = "Clubhouse Hall",
                StartDate = now.AddDays(10),
                EndDate = now.AddDays(10).AddHours(1),
                HostUserId = adminUser.Id,
                Status = "Published"
            }
        );

        await dbContext.SaveChangesAsync();
    }

    private static async Task EnsureMasterAdminClaimAsync(UserManager<AppUser> userManager, AppUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);
        if (!claims.Any(c =>
                c.Type == MasterAdminClaimType
                && string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase)))
        {
            await userManager.AddClaimAsync(user, new Claim(MasterAdminClaimType, "true"));
        }
    }

    private static string GetRequiredSetting(IConfiguration configuration, string key)
    {
        var value = configuration[key];
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new InvalidOperationException(
                $"Missing required configuration value '{key}' for seed operation.");
        }

        return value;
    }

    private static string BuildIdentityErrors(string prefix, IEnumerable<IdentityError> errors)
    {
        var sb = new StringBuilder(prefix);
        foreach (var error in errors)
        {
            sb.Append(' ');
            sb.Append('[');
            sb.Append(error.Code);
            sb.Append("] ");
            sb.Append(error.Description);
        }

        return sb.ToString();
    }
}
