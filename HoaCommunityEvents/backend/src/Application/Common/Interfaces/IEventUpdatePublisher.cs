using HoaCommunityEvents.Application.Common.Realtime;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface IEventUpdatePublisher
{
    Task PublishAsync(EventUpdate update);
}
