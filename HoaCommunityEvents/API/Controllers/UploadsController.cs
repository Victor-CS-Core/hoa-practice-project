using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using HoaCommunityEvents.API.Extensions;
using HoaCommunityEvents.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace HoaCommunityEvents.API.Controllers;

[Authorize(Policy = AuthorizationPolicies.ResidentOrAdmin)]
public class UploadsController(IOptions<CloudinarySettings> cloudinaryOptions) : BaseApiController
{
    private const long MaxImageSizeBytes = 5 * 1024 * 1024;

    [HttpPost("cloudinary/signature")]
    [EnableRateLimiting("upload-signature")]
    public ActionResult<CloudinarySignatureResponse> CreateCloudinarySignature([FromBody] CreateCloudinarySignatureRequest? request)
    {
        var settings = cloudinaryOptions.Value;

        if (!TryBuildUploadTarget(
                request?.Scope,
                request?.ProfileAssetType,
                out var target,
                out var errorResult))
        {
            return ApiError(
                errorResult!.Value.StatusCode,
                errorResult.Value.Code,
                errorResult.Value.Message);
        }

        // Cloudinary signature must be SHA1 over sorted upload params + API secret.
        var stringToSign = $"folder={target.Folder}&public_id={target.PublicId}&timestamp={target.Timestamp}";
        var signature = BuildCloudinarySignature(stringToSign, settings.ApiSecret);

        return Ok(new CloudinarySignatureResponse
        {
            CloudName = settings.CloudName,
            ApiKey = settings.ApiKey,
            Timestamp = target.Timestamp,
            Folder = target.Folder,
            PublicId = target.PublicId,
            Signature = signature
        });
    }

    [HttpPost("cloudinary/upload")]
    [EnableRateLimiting("upload-signature")]
    public async Task<ActionResult<CloudinaryUploadResponse>> UploadToCloudinary(
        [FromForm] CreateCloudinaryUploadRequest? request,
        CancellationToken cancellationToken)
    {
        var settings = cloudinaryOptions.Value;

        if (!TryBuildUploadTarget(
                request?.Scope,
                request?.ProfileAssetType,
                out var target,
                out var errorResult))
        {
            return ApiError(
                errorResult!.Value.StatusCode,
                errorResult.Value.Code,
                errorResult.Value.Message);
        }

        var file = request?.File;
        if (file is null || file.Length == 0)
        {
            return ApiError(
                StatusCodes.Status400BadRequest,
                "invalid_upload_file",
                "A non-empty image file is required.");
        }

        if (file.Length > MaxImageSizeBytes)
        {
            return ApiError(
                StatusCodes.Status400BadRequest,
                "invalid_upload_file_size",
                "Image must be 5MB or smaller.");
        }

        var contentType = file.ContentType?.Trim().ToLowerInvariant();
        if (contentType is not ("image/jpeg" or "image/png" or "image/webp"))
        {
            return ApiError(
                StatusCodes.Status400BadRequest,
                "invalid_upload_file_type",
                "Only JPG, PNG, and WebP images are supported.");
        }

        var signaturePayload =
            $"folder={target.Folder}&public_id={target.PublicId}&timestamp={target.Timestamp}";
        var signature = BuildCloudinarySignature(signaturePayload, settings.ApiSecret);
        var uploadEndpoint = $"https://api.cloudinary.com/v1_1/{settings.CloudName}/image/upload";

        using var httpClient = new HttpClient();
        using var multipart = new MultipartFormDataContent();

        var fileStreamContent = new StreamContent(file.OpenReadStream());
        fileStreamContent.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);

        multipart.Add(fileStreamContent, "file", file.FileName);
        multipart.Add(new StringContent(settings.ApiKey), "api_key");
        multipart.Add(new StringContent(target.Timestamp.ToString()), "timestamp");
        multipart.Add(new StringContent(signature), "signature");
        multipart.Add(new StringContent(target.Folder), "folder");
        multipart.Add(new StringContent(target.PublicId), "public_id");

        using var cloudinaryResponse = await httpClient.PostAsync(
            uploadEndpoint,
            multipart,
            cancellationToken);

        var payload = await cloudinaryResponse.Content.ReadFromJsonAsync<CloudinaryUploadProviderResponse>(
            cancellationToken: cancellationToken);

        if (!cloudinaryResponse.IsSuccessStatusCode || string.IsNullOrWhiteSpace(payload?.SecureUrl))
        {
            return ApiError(
                StatusCodes.Status502BadGateway,
                "cloudinary_upload_failed",
                "Image upload failed. Please try again.");
        }

        return Ok(new CloudinaryUploadResponse
        {
            SecureUrl = payload.SecureUrl
        });
    }

    private bool TryBuildUploadTarget(
        string? scope,
        string? profileAssetType,
        out CloudinaryUploadTarget target,
        out (int StatusCode, string Code, string Message)? errorResult)
    {
        target = default;
        errorResult = null;

        var settings = cloudinaryOptions.Value;

        if (string.IsNullOrWhiteSpace(settings.CloudName)
            || string.IsNullOrWhiteSpace(settings.ApiKey)
            || string.IsNullOrWhiteSpace(settings.ApiSecret))
        {
            errorResult = (
                StatusCodes.Status503ServiceUnavailable,
                "cloudinary_not_configured",
                "Cloudinary is not configured on the server.");
            return false;
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        if (string.IsNullOrWhiteSpace(userId))
        {
            errorResult = (
                StatusCodes.Status401Unauthorized,
                "unauthorized",
                "Unable to determine current user for upload operation.");
            return false;
        }

        var normalizedScope = (scope ?? "event").Trim().ToLowerInvariant();
        if (normalizedScope is not ("event" or "profile"))
        {
            errorResult = (
                StatusCodes.Status400BadRequest,
                "invalid_upload_scope",
                "Upload scope must be either 'event' or 'profile'.");
            return false;
        }

        var normalizedProfileAssetType = (profileAssetType ?? "avatar").Trim().ToLowerInvariant();
        if (normalizedScope == "profile" && normalizedProfileAssetType is not ("avatar" or "banner"))
        {
            errorResult = (
                StatusCodes.Status400BadRequest,
                "invalid_profile_asset_type",
                "Profile asset type must be either 'avatar' or 'banner'.");
            return false;
        }

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var baseFolder = string.IsNullOrWhiteSpace(settings.UploadFolder)
            ? "hoa-events"
            : settings.UploadFolder.Trim().Trim('/');
        var userSegment = SanitizeFolderSegment(userId);
        var folder = normalizedScope == "profile"
            ? $"{baseFolder}/profiles/{userSegment}/{normalizedProfileAssetType}s"
            : $"{baseFolder}/events/{userSegment}";

        target = new CloudinaryUploadTarget
        {
            Timestamp = timestamp,
            Folder = folder,
            PublicId = Guid.NewGuid().ToString("N")
        };

        return true;
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

    public class CreateCloudinaryUploadRequest
    {
        public IFormFile? File { get; init; }
        public string Scope { get; init; } = "event";
        public string ProfileAssetType { get; init; } = "avatar";
    }

    public class CloudinaryUploadResponse
    {
        public string SecureUrl { get; init; } = string.Empty;
    }

    private class CloudinaryUploadProviderResponse
    {
        [JsonPropertyName("secure_url")]
        public string? SecureUrl { get; init; }
    }

    private struct CloudinaryUploadTarget
    {
        public long Timestamp { get; init; }
        public string Folder { get; init; }
        public string PublicId { get; init; }
    }
}
