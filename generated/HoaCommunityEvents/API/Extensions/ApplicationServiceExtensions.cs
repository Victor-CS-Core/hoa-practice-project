using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Services;
using HoaCommunityEvents.Infrastructure.Services;
using HoaCommunityEvents.Infrastructure.Services.Identity;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;

namespace HoaCommunityEvents.API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddOpenApi();
        services.AddSignalR();
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                policy
                    .WithOrigins("http://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IAttendanceService, AttendanceService>();

        return services;
    }
}
