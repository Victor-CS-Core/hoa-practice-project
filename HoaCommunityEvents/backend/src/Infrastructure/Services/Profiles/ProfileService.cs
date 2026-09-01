using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace HoaCommunityEvents.Infrastructure.Services.Profiles;

public class ProfileService(UserManager<AppUser> userManager, ICloudinaryAssetService cloudinaryAssetService) : IProfileService
{
    public async Task<ProfileDto?> GetProfileAsync(string username)
    {
        var user = await userManager.FindByNameAsync(username);
        return user is null ? null : CreateProfileDto(user, await userManager.GetRolesAsync(user));
    }

    public async Task<(bool Success, int StatusCode, string? Error, ProfileDto? Profile)> UpdateProfileAsync(string username, UpdateProfileDto dto, ClaimsPrincipal principal)
    {
        var user = await userManager.GetUserAsync(principal);
        if (user is null) return (false, 401, "Unauthorized.", null);
        if (!string.Equals(user.UserName, username, StringComparison.OrdinalIgnoreCase)) return (false, 403, "You can only edit your own profile.", null);
        var oldAvatar = user.ProfileImageUrl; var oldBanner = user.BannerImageUrl;
        user.DisplayName = dto.DisplayName; user.Bio = dto.Bio; user.ProfileImageUrl = dto.ProfileImageUrl; user.ProfileImagePositionX = dto.ProfileImagePositionX ?? 50; user.ProfileImagePositionY = dto.ProfileImagePositionY ?? 50; user.ProfileImageZoom = dto.ProfileImageZoom ?? 1; user.BannerImageUrl = dto.BannerImageUrl; user.BannerImagePositionX = dto.BannerImagePositionX ?? 50; user.BannerImagePositionY = dto.BannerImagePositionY ?? 50; user.BannerImageZoom = dto.BannerImageZoom ?? 1;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) return (false, 400, result.Errors.FirstOrDefault()?.Description ?? "Failed to update profile.", null);
        if (ShouldDelete(oldAvatar, dto.ProfileImageUrl)) await cloudinaryAssetService.DeleteIfOwnedAsync(oldAvatar);
        if (ShouldDelete(oldBanner, dto.BannerImageUrl)) await cloudinaryAssetService.DeleteIfOwnedAsync(oldBanner);
        return (true, 200, null, CreateProfileDto(user, await userManager.GetRolesAsync(user)));
    }

    private static bool ShouldDelete(string? oldUrl, string? newUrl) => !string.IsNullOrWhiteSpace(oldUrl) && !string.Equals(oldUrl.Trim(), newUrl?.Trim(), StringComparison.OrdinalIgnoreCase);
    private static ProfileDto CreateProfileDto(AppUser user, IList<string> roles) => new() { DisplayName = user.DisplayName, Username = user.UserName ?? string.Empty, Email = user.Email ?? string.Empty, Bio = user.Bio, ProfileImageUrl = user.ProfileImageUrl, ProfileImagePositionX = user.ProfileImagePositionX, ProfileImagePositionY = user.ProfileImagePositionY, ProfileImageZoom = user.ProfileImageZoom, BannerImageUrl = user.BannerImageUrl, BannerImagePositionX = user.BannerImagePositionX, BannerImagePositionY = user.BannerImagePositionY, BannerImageZoom = user.BannerImageZoom, Role = roles.FirstOrDefault() ?? AppRoles.Resident };
}
