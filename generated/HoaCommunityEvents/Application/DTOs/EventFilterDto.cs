namespace HoaCommunityEvents.Application.DTOs;

public class EventFilterDto
{
    public string? Category { get; set; }
    public string? Status { get; set; }
    public string? SortBy { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
