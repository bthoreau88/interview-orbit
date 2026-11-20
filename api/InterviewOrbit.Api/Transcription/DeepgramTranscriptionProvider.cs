using System.Net.Http.Headers;
using System.Text.Json;

namespace InterviewOrbit.Api.Transcription;

/// <summary>
/// Deepgram pre-recorded transcription with filler words enabled (filler_words=true keeps "um"/"uh").
/// The API key comes from configuration (user-secrets locally, an environment variable when hosted) and is never logged.
/// </summary>
public sealed class DeepgramTranscriptionProvider(HttpClient http, IConfiguration config) : ITranscriptionProvider
{
    private const string Endpoint = "https://api.deepgram.com/v1/listen?model=nova-3&filler_words=true&punctuate=true";

    public async Task<TranscriptionResult> TranscribeAsync(ReadOnlyMemory<byte> audio, string contentType, CancellationToken cancellationToken)
    {
        var key = config["Deepgram:ApiKey"];
        if (string.IsNullOrWhiteSpace(key)) throw new TranscriptionUnavailableException("Speech-to-text is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint) { Content = new ReadOnlyMemoryContent(audio) };
        request.Headers.Authorization = new AuthenticationHeaderValue("Token", key);
        request.Content.Headers.ContentType = MediaTypeHeaderValue.Parse(contentType);

        HttpResponseMessage response;
        try
        {
            response = await http.SendAsync(request, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            throw new TranscriptionUnavailableException("Speech-to-text provider could not be reached.", ex);
        }

        using (response)
        {
            if (!response.IsSuccessStatusCode)
                throw new TranscriptionUnavailableException($"Speech-to-text provider returned {(int)response.StatusCode}.");

            using var doc = JsonDocument.Parse(await response.Content.ReadAsStreamAsync(cancellationToken));
            var alternative = doc.RootElement.GetProperty("results").GetProperty("channels")[0].GetProperty("alternatives")[0];
            var words = alternative.TryGetProperty("words", out var w)
                ? w.EnumerateArray().Select(x => new TranscriptWord(
                    x.GetProperty("word").GetString() ?? "", x.GetProperty("start").GetDouble(), x.GetProperty("end").GetDouble())).ToList()
                : [];
            return new TranscriptionResult(alternative.GetProperty("transcript").GetString() ?? "", words);
        }
    }
}
