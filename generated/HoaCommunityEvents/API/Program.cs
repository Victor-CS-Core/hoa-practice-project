using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.API.Middleware;
using HoaCommunityEvents.Infrastructure.Hubs;
using HoaCommunityEvents.Persistence.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationServices(builder.Configuration);
builder.Services.AddIdentityServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<EventHub>("/hubs/events");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    await SeedData.SeedRolesAndAdminAsync(scope.ServiceProvider, app.Configuration);
}

app.Run();
