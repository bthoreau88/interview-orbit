namespace InterviewOrbit.Api.Transcription;

/// <summary>A word with its timing in seconds from the start of the recording.</summary>
public sealed record TranscriptWord(string Word, double Start, double End);

public sealed record TranscriptionResult(string Text, IReadOnlyList<TranscriptWord> Words);

/// <summary>
/// Speech-to-text provider. Implementations must keep filler words ("um", "uh") in the transcript,
/// because filler counting is the point of the app (SDD v1.0 section 1.6).
/// </summary>
public interface ITranscriptionProvider
{
    Task<TranscriptionResult> TranscribeAsync(ReadOnlyMemory<byte> audio, string contentType, CancellationToken cancellationToken);
}

/// <summary>Thrown when the provider is unreachable, rejects the request, or returns an unusable response.</summary>
public sealed class TranscriptionUnavailableException(string message, Exception? inner = null) : Exception(message, inner);
