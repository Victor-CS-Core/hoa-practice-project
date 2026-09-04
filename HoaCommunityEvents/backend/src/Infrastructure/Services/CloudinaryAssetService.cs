using System.Text.RegularExpressions;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using HoaCommunityEvents.Application.Common.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HoaCommunityEvents.Infrastructure.Services;

public sealed class CloudinaryAssetService : ICloudinaryAssetService
{
    private static readonly Regex VersionSegmentRegex =
        new("^v\\d+$", RegexOptions.Compiled | RegexOptions.CultureInvariant);

    private readonly Cloudinary? _cloudinary;
    private readonly ILogger<CloudinaryAssetService> _logger;
    private readonly string? _cloudName;

    public CloudinaryAssetService(
        IConfiguration configuration,
        ILogger<CloudinaryAssetService> logger)
    {
        _logger = logger;

        _cloudName = configuration["Cloudinary:CloudName"]?.Trim();
        var apiKey = configuration["Cloudinary:ApiKey"]?.Trim();
        var apiSecret = configuration["Cloudinary:ApiSecret"]?.Trim();

        if (string.IsNullOrWhiteSpace(_cloudName)
            || string.IsNullOrWhiteSpace(apiKey)
            || string.IsNullOrWhiteSpace(apiSecret))
        {
            return;
        }

        _cloudinary = new Cloudinary(new Account(_cloudName, apiKey, apiSecret));
    }

    public async Task DeleteIfOwnedAsync(string? assetUrl)
    {
        if (_cloudinary is null)
        {
            return;
        }

        if (!TryExtractPublicId(assetUrl, _cloudName, out var publicId))
        {
            return;
        }

        try
        {
            var deletion = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image,
                Invalidate = true
            };

            var result = await _cloudinary.DestroyAsync(deletion);
            if (!string.Equals(result.Result, "ok", StringComparison.OrdinalIgnoreCase)
                && !string.Equals(result.Result, "not found", StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning(
                    "Cloudinary deletion returned non-ok status for public id {PublicId}: {Result}",
                    publicId,
                    result.Result);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cloudinary deletion failed for public id {PublicId}", publicId);
        }
    }

    private static bool TryExtractPublicId(string? assetUrl, string? configuredCloudName, out string publicId)
    {
        publicId = string.Empty;

        if (string.IsNullOrWhiteSpace(assetUrl)
            || !Uri.TryCreate(assetUrl, UriKind.Absolute, out var uri)
            || !uri.Host.Contains("cloudinary.com", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var segments = uri.AbsolutePath
            .Split('/', StringSplitOptions.RemoveEmptyEntries)
            .ToList();

        if (segments.Count < 4)
        {
            return false;
        }

        var cloudNameFromUrl = segments[0];
        if (!string.IsNullOrWhiteSpace(configuredCloudName)
            && !string.Equals(cloudNameFromUrl, configuredCloudName, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var uploadIndex = segments.FindIndex(s => string.Equals(s, "upload", StringComparison.OrdinalIgnoreCase));
        if (uploadIndex < 0 || uploadIndex >= segments.Count - 1)
        {
            return false;
        }

        var trailing = segments.Skip(uploadIndex + 1).ToList();
        var versionIndex = trailing.FindIndex(s => VersionSegmentRegex.IsMatch(s));
        if (versionIndex >= 0)
        {
            trailing = trailing.Skip(versionIndex + 1).ToList();
        }

        if (trailing.Count == 0)
        {
            return false;
        }

        var last = trailing[^1];
        var dotIndex = last.LastIndexOf('.');
        if (dotIndex > 0)
        {
            trailing[^1] = last[..dotIndex];
        }

        publicId = Uri.UnescapeDataString(string.Join('/', trailing));
        return !string.IsNullOrWhiteSpace(publicId);
    }
}
