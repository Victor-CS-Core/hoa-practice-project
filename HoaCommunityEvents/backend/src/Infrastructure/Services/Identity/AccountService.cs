using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace HoaCommunityEvents.Infrastructure.Services.Identity;

public class AccountService(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager) : IAccountService
{
    private const string MasterAdminClaimType = "is_master_admin";

    public async Task<(bool Succeeded, IEnumerable<string> Errors, UserDto? User)> RegisterAsync(RegisterDto dto)
    {
        if (await userManager.FindByEmailAsync(dto.Email) is not null) return (false, ["Email is already in use."], null);
        if (await userManager.FindByNameAsync(dto.Username) is not null) return (false, ["Username is already in use."], null);
        var user = new AppUser { Email = dto.Email, UserName = dto.Username, DisplayName = dto.DisplayName, CreatedAt = DateTime.UtcNow };
        var createResult = await userManager.CreateAsync(user, dto.Password);
        if (!createResult.Succeeded) return (false, createResult.Errors.Select(e => e.Description), null);
        var roleResult = await userManager.AddToRoleAsync(user, AppRoles.Resident);
        if (!roleResult.Succeeded) return (false, roleResult.Errors.Select(e => e.Description), null);
        await signInManager.SignInAsync(user, isPersistent: false);
        return (true, [], CreateUserDto(user, await userManager.GetRolesAsync(user)));
    }

    public async Task<LoginResult> LoginAsync(LoginDto dto)
    {
        var user = await userManager.FindByEmailAsync(dto.Email);
        if (user is null) return LoginResult.Failed(LoginFailureReason.InvalidCredentials);
        var result = await signInManager.PasswordSignInAsync(user, dto.Password, isPersistent: false, lockoutOnFailure: true);
        if (result.Succeeded) return LoginResult.Success(CreateUserDto(user, await userManager.GetRolesAsync(user)));
        return result.IsLockedOut ? LoginResult.Failed(LoginFailureReason.LockedOut) : LoginResult.Failed(LoginFailureReason.InvalidCredentials);
    }

    public async Task LogoutAsync() => await signInManager.SignOutAsync();

    public async Task<UserDto?> GetCurrentUserAsync(ClaimsPrincipal principal)
    {
        var user = await userManager.GetUserAsync(principal);
        return user is null ? null : CreateUserDto(user, await userManager.GetRolesAsync(user));
    }

    public async Task<IReadOnlyList<AdminUserDto>> GetAllUsersForAdminAsync(ClaimsPrincipal principal)
    {
        var currentUser = await userManager.GetUserAsync(principal);
        var currentIsMasterAdmin = currentUser is not null && await IsMasterAdminAsync(currentUser);
        var output = new List<AdminUserDto>();
        foreach (var user in userManager.Users.OrderBy(u => u.DisplayName).ThenBy(u => u.UserName).ToList())
        {
            var roles = await userManager.GetRolesAsync(user);
            var isMasterAdmin = await IsMasterAdminAsync(user);
            var isAdmin = roles.Contains(AppRoles.HoaAdmin);
            output.Add(new AdminUserDto { DisplayName = user.DisplayName, Username = user.UserName ?? string.Empty, Email = user.Email ?? string.Empty, ProfileImageUrl = user.ProfileImageUrl, Role = ResolvePrimaryRole(roles), IsMasterAdmin = isMasterAdmin, CanDelete = !isMasterAdmin && user.Id != currentUser?.Id && (!isAdmin || currentIsMasterAdmin) });
        }
        return output;
    }

    public async Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> PromoteUserToAdminAsync(PromoteUserToAdminDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email)) return (400, "validation_failed", "Email is required.", ["Email is required."], null);
        var user = await userManager.FindByEmailAsync(dto.Email.Trim());
        if (user is null) return (404, "not_found", "User was not found.", ["No user exists with the provided email."], null);
        if (!await userManager.IsInRoleAsync(user, AppRoles.HoaAdmin))
        {
            var addRole = await userManager.AddToRoleAsync(user, AppRoles.HoaAdmin);
            if (!addRole.Succeeded) return (400, "validation_failed", "Failed to promote user.", addRole.Errors.Select(e => e.Description), null);
        }
        if (await userManager.IsInRoleAsync(user, AppRoles.Resident)) await userManager.RemoveFromRoleAsync(user, AppRoles.Resident);
        return (200, "ok", "User promoted to admin.", null, CreateUserDto(user, await userManager.GetRolesAsync(user)));
    }

    public async Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors)> DeleteUserAsync(DeleteUserDto dto, ClaimsPrincipal principal)
    {
        if (string.IsNullOrWhiteSpace(dto.Email)) return (400, "validation_failed", "Email is required.", ["Email is required."]);
        var currentUser = await userManager.GetUserAsync(principal);
        if (currentUser is null) return (401, "unauthorized", "Authentication is required.", null);
        var target = await userManager.FindByEmailAsync(dto.Email.Trim());
        if (target is null) return (404, "not_found", "User was not found.", ["No user exists with the provided email."]);
        if (target.Id == currentUser.Id) return (400, "validation_failed", "You cannot delete your own account.", ["Self deletion is not allowed."]);
        var roles = await userManager.GetRolesAsync(target);
        if (await IsMasterAdminAsync(target)) return (403, "forbidden", "Master admin cannot be deleted.", ["Master admin account is protected."]);
        if (roles.Contains(AppRoles.HoaAdmin) && !await IsMasterAdminAsync(currentUser)) return (403, "forbidden", "Only master admin can delete an admin user.", ["You do not have permission to delete admin users."]);
        try { var result = await userManager.DeleteAsync(target); return result.Succeeded ? (200, "ok", "User deleted successfully.", null) : (400, "validation_failed", "Failed to delete user.", result.Errors.Select(e => e.Description)); }
        catch { return (400, "validation_failed", "Failed to delete user.", ["The user may be referenced by existing records."]); }
    }

    private UserDto CreateUserDto(AppUser user, IList<string> roles) => new() { DisplayName = user.DisplayName, Username = user.UserName ?? string.Empty, Email = user.Email ?? string.Empty, ProfileImageUrl = user.ProfileImageUrl, Role = ResolvePrimaryRole(roles) };
    private async Task<bool> IsMasterAdminAsync(AppUser user) => (await userManager.GetClaimsAsync(user)).Any(c => c.Type == MasterAdminClaimType && string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase));
    private static string ResolvePrimaryRole(IList<string> roles) => roles.Contains(AppRoles.HoaAdmin) ? AppRoles.HoaAdmin : roles.FirstOrDefault() ?? AppRoles.Resident;
}
