using HoaCommunityEvents.Application.DTOs;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HoaCommunityEvents.API.Controllers;

[AllowAnonymous]
public class SecurityController(IAntiforgery antiforgery) : BaseApiController
{
    [HttpGet("csrf")]
    public ActionResult<AntiforgeryTokenDto> GetCsrfToken()
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);
        return Ok(new AntiforgeryTokenDto { RequestToken = tokens.RequestToken ?? string.Empty });
    }
}
