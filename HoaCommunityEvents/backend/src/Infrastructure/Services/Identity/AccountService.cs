using HoaCommunityEvents.Application.Common.Interfaces;
using HoaCommunityEvents.Application.DTOs;
using HoaCommunityEvents.Domain.Common;
using HoaCommunityEvents.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace HoaCommunityEvents.Infrastructure.Services.Identity;

public class AccountService(
    UserManager<AppUser> userManager,
    SignInManager<AppUser> signInManager,
    RoleManager<IdentityRole> roleManager) : IAccountService
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
        if (user is null) return null;
        await signInManager.RefreshSignInAsync(user);
        return CreateUserDto(user, await userManager.GetRolesAsync(user));
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

    public async Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> BootstrapMasterAdminAsync(RegisterDto dto, bool allowReplace = false)
    {
        foreach (var role in new[] { AppRoles.Resident, AppRoles.HoaAdmin })
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        var email = dto.Email.Trim();
        var existingMasters = new List<AppUser>();
        foreach (var existing in userManager.Users.ToList())
        {
            if (await IsMasterAdminAsync(existing))
            {
                existingMasters.Add(existing);
            }
        }

        if (existingMasters.Count > 0)
        {
            var requestedIsSoleMaster = existingMasters.Count == 1
                && string.Equals(existingMasters[0].Email, email, StringComparison.OrdinalIgnoreCase);
            if (!allowReplace && !requestedIsSoleMaster)
            {
                return (409, "master_admin_exists", "A master admin already exists.", null, null);
            }
        }

        var username = dto.Username.Trim();
        var displayName = dto.DisplayName.Trim();
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new AppUser
            {
                Email = email,
                UserName = username,
                DisplayName = displayName,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var create = await userManager.CreateAsync(user, dto.Password);
            if (!create.Succeeded)
            {
                return (400, "validation_failed", "Failed to create master admin.", create.Errors.Select(e => e.Description), null);
            }
        }
        else
        {
            user.UserName = username;
            user.DisplayName = displayName;
            user.EmailConfirmed = true;
            var update = await userManager.UpdateAsync(user);
            if (!update.Succeeded)
            {
                return (400, "validation_failed", "Failed to update master admin.", update.Errors.Select(e => e.Description), null);
            }

            var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
            var reset = await userManager.ResetPasswordAsync(user, resetToken, dto.Password);
            if (!reset.Succeeded)
            {
                return (400, "validation_failed", "Failed to set master admin password.", reset.Errors.Select(e => e.Description), null);
            }
        }

        if (!await userManager.IsInRoleAsync(user, AppRoles.HoaAdmin))
        {
            var addRole = await userManager.AddToRoleAsync(user, AppRoles.HoaAdmin);
            if (!addRole.Succeeded)
            {
                return (400, "validation_failed", "Failed to assign admin role.", addRole.Errors.Select(e => e.Description), null);
            }
        }

        if (await userManager.IsInRoleAsync(user, AppRoles.Resident))
        {
            await userManager.RemoveFromRoleAsync(user, AppRoles.Resident);
        }

        foreach (var other in existingMasters.Where(m => m.Id != user.Id))
        {
            await RemoveMasterAdminClaimAsync(other);
        }

        await EnsureMasterAdminClaimAsync(user);

        await signInManager.SignInAsync(user, isPersistent: false);
        return (200, "ok", "Master admin bootstrapped.", null, CreateUserDto(user, await userManager.GetRolesAsync(user)));
    }

    public async Task<(int StatusCode, string Code, string Message, IEnumerable<string>? Errors, UserDto? User)> TransferMasterAdminAsync(PromoteUserToAdminDto dto, ClaimsPrincipal principal)
    {
        var currentUser = await userManager.GetUserAsync(principal);
        if (currentUser is null)
        {
            return (401, "unauthorized", "Authentication is required.", null, null);
        }

        if (!await IsMasterAdminAsync(currentUser))
        {
            return (403, "forbidden", "Only the master admin can transfer master rights.", null, null);
        }

        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return (400, "validation_failed", "Email is required.", ["Email is required."], null);
        }

        var email = dto.Email.Trim();
        var target = await userManager.FindByEmailAsync(email);
        if (target is null)
        {
            return (404, "not_found", "User was not found.", ["No user exists with the provided email."], null);
        }

        if (!await userManager.IsInRoleAsync(target, AppRoles.HoaAdmin))
        {
            var addRole = await userManager.AddToRoleAsync(target, AppRoles.HoaAdmin);
            if (!addRole.Succeeded)
            {
                return (400, "validation_failed", "Failed to assign admin role.", addRole.Errors.Select(e => e.Description), null);
            }
        }

        if (await userManager.IsInRoleAsync(target, AppRoles.Resident))
        {
            await userManager.RemoveFromRoleAsync(target, AppRoles.Resident);
        }

        foreach (var other in userManager.Users.Where(u => u.Id != target.Id).ToList())
        {
            if (await IsMasterAdminAsync(other))
            {
                await RemoveMasterAdminClaimAsync(other);
            }
        }

        await EnsureMasterAdminClaimAsync(target);
        return (200, "ok", "Master admin transferred.", null, CreateUserDto(target, await userManager.GetRolesAsync(target)));
    }

    private async Task EnsureMasterAdminClaimAsync(AppUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);
        if (!claims.Any(c =>
                c.Type == MasterAdminClaimType
                && string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase)))
        {
            await userManager.AddClaimAsync(user, new Claim(MasterAdminClaimType, "true"));
        }
    }

    private async Task RemoveMasterAdminClaimAsync(AppUser user)
    {
        var claims = await userManager.GetClaimsAsync(user);
        foreach (var claim in claims.Where(c =>
                     c.Type == MasterAdminClaimType
                     && string.Equals(c.Value, "true", StringComparison.OrdinalIgnoreCase)))
        {
            await userManager.RemoveClaimAsync(user, claim);
        }
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
