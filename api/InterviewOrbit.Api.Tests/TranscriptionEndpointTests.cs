using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using InterviewOrbit.Api.Transcription;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace InterviewOrbit.Api.Tests;

public class TranscriptionEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private sealed class FakeProvider(Func<TranscriptionResult> result) : ITranscriptionProvider
    {
        public int Calls;
        public Task<TranscriptionResult> TranscribeAsync(ReadOnlyMemory<byte> audio, string contentType, CancellationToken ct)
        {
            Calls++;
            return Task.FromResult(result());
        }
    }

    private sealed record Response(string Text, List<TranscriptWord> Words, string Source);

    private HttpClient ClientWith(ITranscriptionProvider provider) =>
        factory.WithWebHostBuilder(b => b.ConfigureServices(s =>
        {
            s.RemoveAll<ITranscriptionProvider>();
            s.AddSingleton(provider);
        })).CreateClient();

    private static MultipartFormDataContent Upload(int bytes, string? durationSeconds = "45")
    {
        var audio = new ByteArrayContent(new byte[bytes]);
        audio.Headers.ContentType = new MediaTypeHeaderValue("audio/webm");
        var form = new MultipartFormDataContent { { audio, "audio", "answer.webm" } };
        if (durationSeconds is not null) form.Add(new StringContent(durationSeconds), "durationSeconds");
        return form;
    }

    private static readonly TranscriptionResult WithFillers = new(
        "I, um, planned the sprint and, uh, split the work.",
        [new("I", 0.0, 0.2), new("um", 0.3, 0.6), new("planned", 0.7, 1.1)]);

    [Fact]
    public async Task Returns_live_transcript_with_filler_words_kept()
    {
        var client = ClientWith(new FakeProvider(() => WithFillers));

        var response = await client.PostAsync("/api/transcriptions", Upload(2048));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<Response>();
        Assert.Equal("live", body!.Source);
        Assert.Contains("um", body.Text);
        Assert.Contains(body.Words, w => w.Word == "um");
    }

    [Fact]
    public async Task Rejects_recordings_over_10_MB_with_413()
    {
        var provider = new FakeProvider(() => WithFillers);
        var client = ClientWith(provider);

        var response = await client.PostAsync("/api/transcriptions", Upload((int)TranscriptionEndpoints.MaxBytes + 1));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Equal(0, provider.Calls);
    }

    [Fact]
    public async Task Rejects_recordings_over_180_seconds_with_413()
    {
        var provider = new FakeProvider(() => WithFillers);
        var client = ClientWith(provider);

        var response = await client.PostAsync("/api/transcriptions", Upload(2048, "181"));

        Assert.Equal(HttpStatusCode.RequestEntityTooLarge, response.StatusCode);
        Assert.Equal(0, provider.Calls);
    }

    [Fact]
    public async Task Missing_audio_returns_400()
    {
        var client = ClientWith(new FakeProvider(() => WithFillers));

        var response = await client.PostAsync("/api/transcriptions",
            new MultipartFormDataContent { { new StringContent("10"), "durationSeconds" } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Provider_failure_returns_502_so_the_app_can_fall_back_to_manual_entry()
    {
        var client = ClientWith(new FakeProvider(() => throw new TranscriptionUnavailableException("down")));

        var response = await client.PostAsync("/api/transcriptions", Upload(2048));

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
    }

    [Fact]
    public async Task No_audio_is_written_to_disk_while_it_is_being_transcribed()
    {
        var temp = Path.GetTempPath();
        var before = Directory.GetFiles(temp, "ASPNETCORE_*").ToHashSet();
        var spilled = new List<string>();
        // Look for upload temp files at the moment the provider runs, i.e. while the request is still in flight.
        var client = ClientWith(new FakeProvider(() =>
        {
            spilled.AddRange(Directory.GetFiles(temp, "ASPNETCORE_*").Where(f => !before.Contains(f)));
            return WithFillers;
        }));

        // 5 MB: well above ASP.NET's default 64 KB threshold that would otherwise spill uploads to a temp file.
        var response = await client.PostAsync("/api/transcriptions", Upload(5 * 1024 * 1024));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(spilled);
    }
}
