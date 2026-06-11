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
    public ActionResult<CloudinarySignatureResponse> CreateCloudinarySignature()
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

        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var folder = string.IsNullOrWhiteSpace(settings.UploadFolder)
            ? "hoa-events"
            : settings.UploadFolder.Trim();
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
