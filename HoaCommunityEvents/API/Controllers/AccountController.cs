using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HoaCommunityEvents.API.Controllers;

public class AccountController(IAccountService accountService) : BaseApiController
{
    [AllowAnonymous]
    [EnableRateLimiting("auth-login-register")]
    [HttpPost("register")]
    public async Task<ActionResult<UserDto>> Register(RegisterDto dto)
    {
        var result = await accountService.RegisterAsync(dto);
        if (!result.Succeeded || result.User is null)
        {
            return ApiError(StatusCodes.Status400BadRequest, "validation_failed", "Registration failed.", result.Errors);
        }

        return CreatedAtAction(nameof(CurrentUser), null, result.User);
    }

    [AllowAnonymous]
    [EnableRateLimiting("auth-login-register")]
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        var user = await accountService.LoginAsync(dto);
        return user is null
            ? ApiError(StatusCodes.Status401Unauthorized, "invalid_credentials", "Invalid email or password.")
            : Ok(user);
    }

    [Authorize(Policy = AuthorizationPolicies.ResidentOrAdmin)]
    [HttpGet("current")]
    public async Task<ActionResult<UserDto>> CurrentUser()
    {
        var user = await accountService.GetCurrentUserAsync(User);
        return user is null
            ? ApiError(StatusCodes.Status401Unauthorized, "unauthorized", "Authentication is required.")
            : Ok(user);
    }

    [Authorize(Policy = AuthorizationPolicies.ResidentOrAdmin)]
    [HttpPost("logout")]
    public ActionResult Logout()
    {
        return NoContent();
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpGet("users")]
    public async Task<ActionResult<IReadOnlyList<AdminUserDto>>> GetUsersForAdmin()
    {
        var users = await accountService.GetAllUsersForAdminAsync(User);
        return Ok(users);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost("promote-admin")]
    public async Task<ActionResult<UserDto>> PromoteUserToAdmin(PromoteUserToAdminDto dto)
    {
        var result = await accountService.PromoteUserToAdminAsync(dto);
        if (result.User is null)
        {
            return ApiError(result.StatusCode, result.Code, result.Message, result.Errors);
        }

        return Ok(result.User);
    }

    [Authorize(Policy = AuthorizationPolicies.AdminOnly)]
    [HttpPost("delete-user")]
    public async Task<ActionResult> DeleteUser(DeleteUserDto dto)
    {
        var result = await accountService.DeleteUserAsync(dto, User);
        if (result.StatusCode != StatusCodes.Status200OK)
        {
            return ApiError(result.StatusCode, result.Code, result.Message, result.Errors);
        }

        return Ok(new { message = result.Message });
    }
}
