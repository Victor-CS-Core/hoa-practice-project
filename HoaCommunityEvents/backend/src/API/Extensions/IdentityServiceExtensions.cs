using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace HoaCommunityEvents.API.Extensions;

public static class IdentityServiceExtensions
{
    public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment)
    {
        services.AddIdentityCore<AppUser>(options =>
        {
            options.User.RequireUniqueEmail = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
        })
        .AddRoles<IdentityRole>()
        .AddSignInManager<SignInManager<AppUser>>()
        .AddEntityFrameworkStores<AppDbContext>();

        services.AddAuthentication(IdentityConstants.ApplicationScheme)
            .AddCookie(IdentityConstants.ApplicationScheme, options =>
            {
                options.Cookie.Name = "HoaCommunityEvents.Auth";
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = environment.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;
                options.ExpireTimeSpan = TimeSpan.FromHours(8);
                options.SlidingExpiration = true;
                options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = StatusCodes.Status401Unauthorized; return Task.CompletedTask; };
                options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = StatusCodes.Status403Forbidden; return Task.CompletedTask; };
            });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(AuthorizationPolicies.AdminOnly, policy =>
                policy.RequireRole(AppRoles.HoaAdmin));

            options.AddPolicy(AuthorizationPolicies.ResidentOrAdmin, policy =>
                policy.RequireRole(AppRoles.Resident, AppRoles.HoaAdmin));
        });

        return services;
    }
}
