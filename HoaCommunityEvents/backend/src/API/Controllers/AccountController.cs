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
    [EnableRateLimiting(RateLimitPolicies.AuthLoginRegister)]
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
    [EnableRateLimiting(RateLimitPolicies.AuthLoginRegister)]
    [HttpPost("login")]
    public async Task<ActionResult<UserDto>> Login(LoginDto dto)
    {
        var result = await accountService.LoginAsync(dto);
        if (result.Succeeded && result.User is not null)
        {
            return Ok(result.User);
        }

        if (result.FailureReason == LoginFailureReason.LockedOut)
        {
            return ApiError(
                StatusCodes.Status423Locked,
                "account_locked",
                "Account is temporarily locked due to repeated failed sign-in attempts. Try again later.");
        }

        return ApiError(StatusCodes.Status401Unauthorized, "invalid_credentials", "Invalid email or password.");
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
    public async Task<ActionResult> Logout()
    {
        await accountService.LogoutAsync();
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

    /// <summary>
    /// One-time bootstrap used when no master admin exists yet. After the first
    /// successful call, further calls return 409 (unless resetting the existing
    /// sole master account credentials).
    /// </summary>
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.AuthLoginRegister)]
    [HttpPost("bootstrap-master-admin")]
    public async Task<ActionResult<UserDto>> BootstrapMasterAdmin(RegisterDto dto)
    {
        var result = await accountService.BootstrapMasterAdminAsync(dto, allowReplace: false);
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
