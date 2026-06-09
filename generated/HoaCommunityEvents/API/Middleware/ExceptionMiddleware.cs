using System.Net;
using System.Text.Json;
using HoaCommunityEvents.API.Models;

namespace HoaCommunityEvents.API.Middleware;

public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception while processing request.");

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var payload = new ApiErrorResponse
            {
                Code = "internal_error",
                Message = "An unexpected server error occurred.",
                TraceId = context.TraceIdentifier
            };

            var json = JsonSerializer.Serialize(payload);
            await context.Response.WriteAsync(json);
        }
    }
}
