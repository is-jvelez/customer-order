using System.Reflection;
using AuthService.Domain.Entities;
using FluentAssertions;

namespace AuthService.UnitTest.TestCommon;

internal static class DomainEntityFactory
{
    public static User CreateUser(
        int id = 1,
        string email = "user@example.com",
        string passwordHash = "hashed-password")
    {
        var user = User.Create(email, passwordHash);
        SetPrivateProperty(user, nameof(User.Id), id);
        SetPrivateProperty(user, nameof(User.CreatedAt), DateTime.UtcNow.AddMinutes(-5));
        return user;
    }

    public static RefreshToken CreateRefreshToken(
        int id = 1,
        int userId = 1,
        string token = "refresh-token",
        DateTime? expiresAt = null)
    {
        var refreshToken = RefreshToken.Create(
            userId,
            token,
            expiresAt ?? DateTime.UtcNow.AddDays(7));

        SetPrivateProperty(refreshToken, nameof(RefreshToken.Id), id);
        SetPrivateProperty(refreshToken, nameof(RefreshToken.CreatedAt), DateTime.UtcNow.AddMinutes(-5));
        return refreshToken;
    }

    private static void SetPrivateProperty<T, TValue>(T target, string propertyName, TValue value)
    {
        var property = typeof(T).GetProperty(
            propertyName,
            BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

        property.Should().NotBeNull($"property '{propertyName}' must exist on {typeof(T).Name}");
        property!.SetValue(target, value);
    }
}
