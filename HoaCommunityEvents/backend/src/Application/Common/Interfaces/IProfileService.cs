using HoaCommunityEvents.Application.DTOs;
using System.Security.Claims;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IProfileService
{
    Task<ProfileDto?> GetProfileAsync(string username);
    Task<(bool Success, int StatusCode, string? Error, ProfileDto? Profile)> UpdateProfileAsync(string username, UpdateProfileDto dto, ClaimsPrincipal principal);
}
