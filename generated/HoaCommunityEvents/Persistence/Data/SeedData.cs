using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace HoaCommunityEvents.Persistence.Data;

public static class SeedData
{
    private const string MasterAdminClaimType = "is_master_admin";

    public static async Task SeedRolesAndAdminAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
        var dbContext = serviceProvider.GetRequiredService<AppDbContext>();

        var roles = new[] { AppRoles.Resident, AppRoles.HoaAdmin };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var adminEmail = configuration["AdminSeed:Email"] ?? "admin@hoa.local";
        var adminUserName = configuration["AdminSeed:Username"] ?? "hoaadmin";
        var adminPassword = configuration["AdminSeed:Password"] ?? "Admin123$";
        var adminDisplayName = configuration["AdminSeed:DisplayName"] ?? "HOA Admin";

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
            if (createAdmin.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, AppRoles.HoaAdmin);
                await EnsureMasterAdminClaimAsync(userManager, adminUser);
            }
        }
        else
        {
            adminUser = existingAdmin;

            if (!await userManager.IsInRoleAsync(existingAdmin, AppRoles.HoaAdmin))
            {
                await userManager.AddToRoleAsync(existingAdmin, AppRoles.HoaAdmin);
            }

            await EnsureMasterAdminClaimAsync(userManager, existingAdmin);
        }

        if (!dbContext.Events.Any())
        {
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
}
