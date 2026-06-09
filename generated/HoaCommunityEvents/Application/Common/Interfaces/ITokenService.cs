using HoaCommunityEvents.Domain.Entities;

namespace HoaCommunityEvents.Application.Common.Interfaces;

public interface ITokenService
{
    string CreateToken(AppUser user, IList<string> roles);
}
