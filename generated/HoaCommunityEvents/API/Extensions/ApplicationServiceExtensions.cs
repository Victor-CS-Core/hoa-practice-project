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

        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEventService, EventService>();

        return services;
    }
}
