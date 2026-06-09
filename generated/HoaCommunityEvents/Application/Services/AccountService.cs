using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace HoaCommunityEvents.Application.Services;

public class AccountService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    ITokenService tokenService) : IAccountService
{
    public async Task<(bool Succeeded, IEnumerable<string> Errors, UserDto? User)> RegisterAsync(RegisterDto dto)
    {
        if (await userManager.FindByEmailAsync(dto.Email) is not null)
        {
            return (false, ["Email is already in use."], null);
        }

        if (await userManager.FindByNameAsync(dto.Username) is not null)
        {
            return (false, ["Username is already in use."], null);
        }

        var user = new AppUser
        {
            Email = dto.Email,
            UserName = dto.Username,
            DisplayName = dto.DisplayName,
            CreatedAt = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded)
        {
            return (false, createResult.Errors.Select(e => e.Description), null);
        }

        await userManager.AddToRoleAsync(user, AppRoles.Resident);
        var roles = await userManager.GetRolesAsync(user);

        return (true, [], CreateUserDto(user, roles));
    }

    public async Task<UserDto?> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null)
        {
            return null;
        }

        var passwordResult = await signInManager.CheckPasswordSignInAsync(user, dto.Password, false);
        if (!passwordResult.Succeeded)
        {
            return null;
        }

        var roles = await userManager.GetRolesAsync(user);
        return CreateUserDto(user, roles);
    }

    public async Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null)
        {
            return null;
        }

        var roles = await userManager.GetRolesAsync(user);
        return CreateUserDto(user, roles);
    }

    private UserDto CreateUserDto(AppUser user, IList<string> roles)
    {
        return new UserDto
        {
            DisplayName = user.DisplayName,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            ProfileImageUrl = user.ProfileImageUrl,
            Role = roles.FirstOrDefault() ?? AppRoles.Resident,
            Token = tokenService.CreateToken(user, roles)
        };
    }
}
