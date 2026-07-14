using AuthService.Shared.Wrappers;
using FluentAssertions;

namespace AuthService.UnitTest.Shared.Wrappers;

public class ApiResponseTests
{
    [Fact]
    public void Ok_ShouldCreateSuccessfulResponse_WhenDataIsProvided()
    {
        var result = ApiResponse<string>.Ok("payload", "success");

        result.Success.Should().BeTrue();
        result.Data.Should().Be("payload");
        result.Message.Should().Be("success");
        result.Errors.Should().BeEmpty();
    }

    [Fact]
    public void Fail_ShouldCreateFailureResponse_WhenErrorsAreProvided()
    {
        var errors = new[] { "error-1", "error-2" };

        var result = ApiResponse<object>.Fail("failed", errors);

        result.Success.Should().BeFalse();
        result.Data.Should().BeNull();
        result.Message.Should().Be("failed");
        result.Errors.Should().BeEquivalentTo(errors);
    }
}
