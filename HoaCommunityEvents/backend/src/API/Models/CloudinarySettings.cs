namespace HoaCommunityEvents.API.Models;

public class CloudinarySettings
{
    public string CloudName { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ApiSecret { get; set; } = string.Empty;
    public string UploadFolder { get; set; } = "hoa-events";
}
