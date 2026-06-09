using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HoaCommunityEvents.API.Controllers;

[Authorize]
public class ProfilesController(IProfileService profileService) : BaseApiController
{
    [HttpGet("{username}")]
    public async Task<ActionResult<ProfileDto>> GetProfile(string username)
    {
        var profile = await profileService.GetProfileAsync(username);
        if (profile is null)
        {
            return ApiError(StatusCodes.Status404NotFound, "profile_not_found", "Profile was not found.");
        }

        return Ok(profile);
    }

    [HttpPut("{username}")]
    public async Task<ActionResult<ProfileDto>> UpdateProfile(string username, UpdateProfileDto dto)
    {
        var result = await profileService.UpdateProfileAsync(username, dto, User);
        if (!result.Success)
        {
            return ApiError(result.StatusCode, "profile_update_failed", result.Error ?? "Failed to update profile.");
        }

        return Ok(result.Profile);
    }
}
