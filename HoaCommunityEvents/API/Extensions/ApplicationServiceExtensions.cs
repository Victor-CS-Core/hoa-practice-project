using FluentValidation;
using FluentValidation.AspNetCore;
using HoaCommunityEvents.API.Models;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.Services;
using HoaCommunityEvents.Application.Validators;
using HoaCommunityEvents.Infrastructure.Services;
using HoaCommunityEvents.Infrastructure.Services.Identity;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using System.Threading.RateLimiting;

namespace HoaCommunityEvents.API.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        var configuredCorsOrigins = GetConfiguredCorsOrigins(configuration);

        services.AddControllers();
        services.Configure<CloudinarySettings>(configuration.GetSection("Cloudinary"));
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();
        services.Configure<ApiBehaviorOptions>(options =>
        {
            options.InvalidModelStateResponseFactory = context =>
            {
                var details = context.ModelState
                    .Where(kvp => kvp.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

                return new BadRequestObjectResult(new ApiErrorResponse
                {
                    Code = "validation_failed",
                    Message = "Validation failed.",
                    Details = details,
                    TraceId = context.HttpContext.TraceIdentifier
                });
            };
        });
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
            options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecuritySchemeReference("Bearer", null),
                    []
                }
            });
        });
        services.AddSignalR();
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            options.AddPolicy("upload-signature", context =>
            {
                var partitionKey = context.User.Identity?.Name
                    ?? context.Connection.RemoteIpAddress?.ToString()
                    ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });

            options.AddPolicy("auth-login-register", context =>
            {
                var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 8,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0,
                    AutoReplenishment = true
                });
            });
        });

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                if (configuredCorsOrigins.Length > 0)
                {
                    policy
                        .WithOrigins(configuredCorsOrigins)
                        .AllowAnyHeader()
                        .AllowAnyMethod()
                        .AllowCredentials();
                    return;
                }

                policy
                    .SetIsOriginAllowed(origin =>
                    {
                        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                        {
                            return false;
                        }

                        return uri.Scheme is "http" or "https"
                            && (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                                || uri.Host.Equals("127.0.0.1"));
                    })
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
        services.AddScoped<ICloudinaryAssetService, CloudinaryAssetService>();

        return services;
    }

    private static string[] GetConfiguredCorsOrigins(IConfiguration configuration)
    {
        var sectionOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.Trim())
            .ToArray() ?? [];

        if (sectionOrigins.Length > 0)
        {
            return sectionOrigins
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();
        }

        var flatOriginsValue = configuration["Cors:AllowedOrigins"];
        if (string.IsNullOrWhiteSpace(flatOriginsValue))
        {
            return [];
        }

        return flatOriginsValue
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }
}
