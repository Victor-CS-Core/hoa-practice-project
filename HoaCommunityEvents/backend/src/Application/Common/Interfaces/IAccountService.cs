using HoaCommunityEvents.Application.DTOs;
using System.Security.Claims;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IAccountService
{
    Task<(bool Succeeded, IEnumerable<string> Errors, UserDto? User)> RegisterAsync(RegisterDto dto);
    Task<LoginResult> LoginAsync(LoginDto dto);
    Task LogoutAsync();
    Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal principal);
    Task<IReadOnlyList<AdminUserDto>> GetAllUsersForAdminAsync(ClaimsPrincipal principal);
    Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> PromoteUserToAdminAsync(PromoteUserToAdminDto dto);
    Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> BootstrapMasterAdminAsync(RegisterDto dto, bool allowReplace = false);
    Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> TransferMasterAdminAsync(PromoteUserToAdminDto dto, ClaimsPrincipal principal);
    Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors)> DeleteUserAsync(DeleteUserDto dto, ClaimsPrincipal principal);
}
