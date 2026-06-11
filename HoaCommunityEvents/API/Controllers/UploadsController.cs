using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace HoaCommunityEvents.API.Controllers;

[Authorize(Policy = AuthorizationPolicies.ResidentOrAdmin)]
public class UploadsController(IOptions<CloudinarySettings> cloudinaryOptions) : BaseApiController
{
    [HttpPost("cloudinary/signature")]
    public ActionResult<CloudinarySignatureResponse> CreateCloudinarySignature([FromBody] CreateCloudinarySignatureRequest? request)
    {
        var settings = cloudinaryOptions.Value;

        if (string.IsNullOrWhiteSpace(settings.CloudName)
            || string.IsNullOrWhiteSpace(settings.ApiKey)
            || string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            return ApiError(
                StatusCodes.Status503ServiceUnavailable,
                "cloudinary_not_configured",
                "Cloudinary is not configured on the server.");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        if (string.IsNullOrWhiteSpace(userId))
        {
            return ApiError(
                StatusCodes.Status401Unauthorized,
                "unauthorized",
                "Unable to determine current user for upload signature.");
        }

        var normalizedScope = (request?.Scope ?? "event").Trim().ToLowerInvariant();
        if (normalizedScope is not ("event" or "profile"))
        {
            return ApiError(
                StatusCodes.Status400BadRequest,
                "invalid_upload_scope",
                "Upload scope must be either 'event' or 'profile'.");
        }

        var normalizedProfileAssetType = (request?.ProfileAssetType ?? "avatar").Trim().ToLowerInvariant();
        if (normalizedScope == "profile" && normalizedProfileAssetType is not ("avatar" or "banner"))
        {
            return ApiError(
            StatusCodes.Status400BadRequest,
            "invalid_profile_asset_type",
            "Profile asset type must be either 'avatar' or 'banner'.");
        }

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var baseFolder = string.IsNullOrWhiteSpace(settings.UploadFolder)
            ? "hoa-events"
            : settings.UploadFolder.Trim().Trim('/');
        var userSegment = SanitizeFolderSegment(userId);
        var folder = normalizedScope == "profile"
            ? $"{baseFolder}/profiles/{userSegment}/{normalizedProfileAssetType}s"
            : $"{baseFolder}/events/{userSegment}";
        var publicId = Guid.NewGuid().ToString("N");

        // Cloudinary signature must be SHA1 over sorted upload params + API secret.
        var stringToSign = $"folder={folder}&public_id={publicId}&timestamp={timestamp}";
        var signature = BuildCloudinarySignature(stringToSign, settings.ApiSecret);

        return Ok(new CloudinarySignatureResponse
        {
            CloudName = settings.CloudName,
            ApiKey = settings.ApiKey,
            Timestamp = timestamp,
            Folder = folder,
            PublicId = publicId,
            Signature = signature
        });
    }

    private static string BuildCloudinarySignature(string payload, string apiSecret)
    {
        var bytes = Encoding.UTF8.GetBytes(payload + apiSecret);
        var hash = SHA1.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string SanitizeFolderSegment(string value)
    {
        var chars = value
            .Select(c => char.IsLetterOrDigit(c) || c is '-' or '_' ? c : '_')
            .ToArray();
        var sanitized = new string(chars).Trim('_');
        return string.IsNullOrWhiteSpace(sanitized) ? "unknown-user" : sanitized;
    }

    public class CreateCloudinarySignatureRequest
    {
        public string Scope { get; init; } = "event";
        public string ProfileAssetType { get; init; } = "avatar";
    }

    public class CloudinarySignatureResponse
    {
        public string CloudName { get; init; } = string.Empty;
        public string ApiKey { get; init; } = string.Empty;
        public long Timestamp { get; init; }
        public string Folder { get; init; } = string.Empty;
        public string PublicId { get; init; } = string.Empty;
        public string Signature { get; init; } = string.Empty;
    }
}
