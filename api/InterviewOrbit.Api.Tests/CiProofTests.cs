namespace InterviewOrbit.Api.Tests;

// BTHOR-4 proof only: this test fails on purpose to show CI blocks the merge. This PR is closed, never merged.
public class CiProofTests
{
    [Fact]
    public void Deliberately_failing_test() => Assert.Equal(1, 2);
}
