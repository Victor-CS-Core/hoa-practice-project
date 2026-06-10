using Microsoft.AspNetCore.SignalR;

namespace HoaCommunityEvents.Infrastructure.Hubs;

public class EventHub : Hub
{
    public Task JoinEventGroup(string eventId)
    {
        return Groups.AddToGroupAsync(Context.ConnectionId, GroupName(eventId));
    }

    public Task LeaveEventGroup(string eventId)
    {
        return Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(eventId));
    }

    public static string GroupName(string eventId) => $"event-{eventId}";
}
