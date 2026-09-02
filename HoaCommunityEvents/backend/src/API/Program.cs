using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.API.Endpoints;
using HoaCommunityEvents.API.Middleware;
using HoaCommunityEvents.API.Models;
using HoaCommunityEvents.Persistence.Data;
using Microsoft.Extensions.Configuration;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationServices(builder.Configuration, builder.Environment);
builder.Services.AddIdentityServices(builder.Configuration, builder.Environment);

var app = builder.Build();

app.ValidateStartupConfiguration();

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

app.Run();

public partial class Program;
