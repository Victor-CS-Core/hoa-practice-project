using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Services;
using HoaCommunityEvents.Infrastructure.Services;
using HoaCommunityEvents.Infrastructure.Services.Identity;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi;

namespace HoaCommunityEvents.API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddControllers();
        services.AddOpenApi();
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "HoaCommunityEvents API",
                Version = "v1"
            });

            options.TagActionsBy(api =>
            {
                var controller = api.ActionDescriptor.RouteValues.TryGetValue("controller", out var value)
                    ? value
                    : null;

                return controller is null ? ["API"] : [controller];
            });

            var bearerScheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter JWT token as: Bearer {token}"
            };

            options.AddSecurityDefinition("Bearer", bearerScheme);
        });
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
