using Microsoft.AspNetCore.Http.Features;

namespace InterviewOrbit.Api.Transcription;

public static class TranscriptionEndpoints
{
    public const long MaxBytes = 10 * 1024 * 1024;
    public const double MaxSeconds = 180;

    public sealed record TranscriptionResponse(string Text, IReadOnlyList<TranscriptWord> Words, string Source);

    /// <summary>
    /// POST /api/transcriptions (multipart/form-data): "audio" file + "durationSeconds" measured by the recorder.
    /// Audio is read into memory, sent to the provider, and released when the request ends; it is never written to disk.
    /// </summary>
    public static IEndpointRouteBuilder MapTranscriptions(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/transcriptions", async (HttpRequest request, ITranscriptionProvider provider, CancellationToken ct) =>
        {
            if (request.ContentLength is > MaxBytes + 64 * 1024)
                return Results.Problem("Recording is larger than 10 MB.", statusCode: StatusCodes.Status413PayloadTooLarge);
            if (!request.HasFormContentType)
                return Results.Problem("Expected multipart/form-data with an 'audio' file.", statusCode: StatusCodes.Status400BadRequest);

            var form = await request.ReadFormAsync(ct);
            var file = form.Files.GetFile("audio");
            if (file is null || file.Length == 0)
                return Results.Problem("No audio file was sent.", statusCode: StatusCodes.Status400BadRequest);
            if (file.Length > MaxBytes)
                return Results.Problem("Recording is larger than 10 MB.", statusCode: StatusCodes.Status413PayloadTooLarge);
            if (double.TryParse(form["durationSeconds"], System.Globalization.CultureInfo.InvariantCulture, out var seconds) && seconds > MaxSeconds)
                return Results.Problem("Recording is longer than 180 seconds.", statusCode: StatusCodes.Status413PayloadTooLarge);

            var buffer = new byte[file.Length];
            await using (var stream = file.OpenReadStream())
                await stream.ReadExactlyAsync(buffer, ct);

            try
            {
                var result = await provider.TranscribeAsync(buffer, file.ContentType ?? "audio/webm", ct);
                return Results.Ok(new TranscriptionResponse(result.Text, result.Words, "live"));
            }
            catch (TranscriptionUnavailableException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status502BadGateway);
            }
            finally
            {
                Array.Clear(buffer);
            }
        }).DisableAntiforgery();
        return app;
    }

    /// <summary>Keep uploads up to the limit in memory so ASP.NET never buffers them to a temp file.</summary>
    public static IServiceCollection AddTranscription(this IServiceCollection services)
    {
        services.Configure<FormOptions>(o =>
        {
            o.MemoryBufferThreshold = (int)MaxBytes + 1;
            o.MultipartBodyLengthLimit = MaxBytes + 64 * 1024;
        });
        services.AddHttpClient<ITranscriptionProvider, DeepgramTranscriptionProvider>(c => c.Timeout = TimeSpan.FromSeconds(30));
        return services;
    }
}
