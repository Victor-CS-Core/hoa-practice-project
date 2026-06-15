namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface ICloudinaryAssetService
{
    Task DeleteIfOwnedAsync(string? assetUrl);
}
