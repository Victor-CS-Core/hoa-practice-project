using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.API.Endpoints;
using HoaCommunityEvents.API.Middleware;
using HoaCommunityEvents.API.Models;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.Extensions.Configuration;

var bootstrapAdminOnly = args.Contains("--bootstrap-admin-only", StringComparer.Ordinal);

var builder = WebApplication.CreateBuilder(args);

// Optional ops overlay (never committed). Used to inject MasterAdminBootstrap:ReplaceKey
// into a one-shot production package, then removed on the next clean deploy.
builder.Configuration.AddJsonFile("appsettings.Bootstrap.json", optional: true, reloadOnChange: false);

builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
builder.Services.AddIdentityServices(builder.Configuration, builder.Environment);

var app = builder.Build();

app.ValidateStartupConfiguration();

using (var scope = app.Services.CreateScope())
{
    var enableBootstrapSeed = app.Configuration.GetValue<bool>("Seed:EnableBootstrap");
    var enableDemoSeed = app.Configuration.GetValue<bool>("Seed:EnableDemoData");

    if (enableBootstrapSeed)
    {
        await SeedData.SeedRolesAndAdminAsync(scope.ServiceProvider, app.Configuration);
    }

    if (enableDemoSeed)
    {
        if (app.Environment.IsProduction())
        {
            throw new InvalidOperationException(
                "Seed:EnableDemoData must be false in Production.");
        }

        await SeedData.SeedDemoEventsAsync(scope.ServiceProvider, app.Configuration);
    }
}

if (bootstrapAdminOnly)
{
    if (!app.Configuration.GetValue<bool>("Seed:EnableBootstrap"))
    {
        throw new InvalidOperationException(
            "Seed:EnableBootstrap must be true when using --bootstrap-admin-only.");
    }

    Console.WriteLine("Master admin bootstrap completed.");
    return;
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapEventStreamEndpoints();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.Map("/api/{**path}", (HttpContext context) => Results.NotFound(new ApiErrorResponse
{
    Code = "not_found",
    Message = "API endpoint not found.",
    TraceId = context.TraceIdentifier
}));
app.MapFallbackToFile("index.html");

app.Run();

public partial class Program;
