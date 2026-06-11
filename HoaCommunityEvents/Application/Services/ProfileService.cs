using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace HoaCommunityEvents.Application.Services;

public class ProfileService(UserManager<AppUser> userManager) : IProfileService
{
    public async Task<ProfileDto?> GetProfileAsync(string username)
    {
        var user = await userManager.FindByNameAsync(username);
        if (user is null)
        {
            return null;
        }

        var roles = await userManager.GetRolesAsync(user);
        return CreateProfileDto(user, roles);
    }

    public async Task<(bool Success, int StatusCode, string? Error, ProfileDto? Profile)> UpdateProfileAsync(
        string username,
        UpdateProfileDto dto,
        ClaimsPrincipal principal)
    {
        var currentUser = await userManager.GetUserAsync(principal);
        if (currentUser is null)
        {
            return (false, 401, "Unauthorized.", null);
        }

        if (!string.Equals(currentUser.UserName, username, StringComparison.OrdinalIgnoreCase))
        {
            return (false, 403, "You can only edit your own profile.", null);
        }

        currentUser.DisplayName = dto.DisplayName;
        currentUser.Bio = dto.Bio;
        currentUser.ProfileImageUrl = dto.ProfileImageUrl;
        currentUser.BannerImageUrl = dto.BannerImageUrl;

        var updateResult = await userManager.UpdateAsync(currentUser);
        if (!updateResult.Succeeded)
        {
            var error = updateResult.Errors.FirstOrDefault()?.Description ?? "Failed to update profile.";
            return (false, 400, error, null);
        }

        var roles = await userManager.GetRolesAsync(currentUser);
        return (true, 200, null, CreateProfileDto(currentUser, roles));
    }

    private static ProfileDto CreateProfileDto(AppUser user, IList<string> roles)
    {
        return new ProfileDto
        {
            DisplayName = user.DisplayName,
            Username = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            Bio = user.Bio,
            ProfileImageUrl = user.ProfileImageUrl,
            BannerImageUrl = user.BannerImageUrl,
            Role = roles.FirstOrDefault() ?? AppRoles.Resident
        };
    }
}
