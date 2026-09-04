using Microsoft.AspNetCore.Mvc;
using HoaCommunityEvents.API.Models;

namespace HoaCommunityEvents.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BaseApiController : ControllerBase
{
    protected ActionResult ApiError(int statusCode, string code, string message, object? details = null)
    {
        return StatusCode(statusCode, new ApiErrorResponse
        {
            Code = code,
            Message = message,
            Details = details,
            TraceId = HttpContext.TraceIdentifier
        });
    }
}
