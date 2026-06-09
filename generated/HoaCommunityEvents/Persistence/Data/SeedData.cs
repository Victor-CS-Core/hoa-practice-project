using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HoaCommunityEvents.Persistence.Data;

public static class SeedData
{
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

        var adminEmail = configuration["AdminSeed:Email"] ?? "admin@hoa.local";
        var adminUserName = configuration["AdminSeed:Username"] ?? "hoaadmin";
        var adminPassword = configuration["AdminSeed:Password"] ?? "Admin123$";
        var adminDisplayName = configuration["AdminSeed:DisplayName"] ?? "HOA Admin";

        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin is null)
        {
            var admin = new AppUser
            {
                Email = adminEmail,
                UserName = adminUserName,
                DisplayName = adminDisplayName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var createAdmin = await userManager.CreateAsync(admin, adminPassword);
            if (createAdmin.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, AppRoles.HoaAdmin);
            }

            return;
        }

        if (!await userManager.IsInRoleAsync(existingAdmin, AppRoles.HoaAdmin))
        {
            await userManager.AddToRoleAsync(existingAdmin, AppRoles.HoaAdmin);
        }
    }
}
