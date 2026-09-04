namespace HoaCommunityEvents.Application.DTOs;

public enum LoginFailureReason
{
    None = 0,
    InvalidCredentials = 1,
    LockedOut = 2
}

public sealed class LoginResult
{
    public bool Succeeded => User is not null;

    public UserDto? User { get; init; }

    public LoginFailureReason FailureReason { get; init; }

    public static LoginResult Success(UserDto user)
    {
        return new LoginResult
        {
            User = user,
            FailureReason = LoginFailureReason.None
        };
    }

    public static LoginResult Failed(LoginFailureReason reason)
    {
        return new LoginResult
        {
            User = null,
            FailureReason = reason
        };
    }
}
