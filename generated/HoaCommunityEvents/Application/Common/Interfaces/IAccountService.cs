using HoaCommunityEvents.Application.DTOs;
using System.Security.Claims;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IAccountService
{
    Task<(bool Succeeded, IEnumerable<string> Errors, UserDto? User)> RegisterAsync(RegisterDto dto);
    Task<UserDto?> LoginAsync(LoginDto dto);
    Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal principal);
}
