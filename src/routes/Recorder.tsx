import { Link, useNavigate, useParams } from "react-router";
import { Page } from "../components/Page";
import { findPrompt } from "../domain/prompts";
import { formatClock } from "../recorder/recorderState";
import { MAX_RECORDING_SECONDS, useRecorder } from "../recorder/useRecorder";
import { useDraftSession } from "../state/DraftSession";

export function Recorder() {
  const { promptId } = useParams();
  const prompt = findPrompt(promptId);
  const navigate = useNavigate();
  const { begin } = useDraftSession();
  const { state, elapsed, start, stop, reset, handOff } = useRecorder();

  if (!prompt) {
    return (
      <Page title="Question not found" eyebrow="Recorder">
        <div className="notice notice-danger" role="alert">
          <strong>We could not find that question.</strong>
          The link may be out of date.
        </div>
        <Link to="/practice" className="btn btn-primary">
          Back to questions
        </Link>
      </Page>
    );
  }

  const continueWithRecording = () => {
    const recording = handOff();
    if (!recording) return;
    begin(prompt.id, recording);
    navigate("/results");
  };

  const continueWithoutRecording = () => {
    reset();
    begin(prompt.id, null);
    navigate("/results");
  };

  const statusText: Record<typeof state.phase, string> = {
    unsupported: "Recording is not supported in this browser.",
    idle: "Microphone is off.",
    requesting: "Waiting for microphone permission...",
    recording: "Recording. Microphone is on.",
    stopped: "Recording stopped. Microphone is off.",
    error: "Microphone is off.",
  };

  return (
    <Page title="Record your answer" eyebrow={prompt.category}>
      <section className="glass stack" aria-labelledby="prompt-heading">
        <h2 id="prompt-heading" className="visually-hidden">
          Question
        </h2>
        <p className="prompt-text" style={{ fontSize: "1.25rem", fontWeight: 600 }} data-testid="recorder-prompt">
          {prompt.text}
        </p>
        <p className="muted">{prompt.hint}</p>
      </section>

      <section className="glass stack" aria-labelledby="rec-heading">
        <h2 id="rec-heading">Recorder</h2>
        <p className="visually-hidden" role="status" aria-live="polite" data-testid="recorder-status">
          {statusText[state.phase]}
        </p>

        {(state.phase === "idle" || state.phase === "requesting") && (
          <>
            <div className="notice notice-info" data-testid="consent">
              <strong>Before you start</strong>
              Your microphone turns on only when you press Start recording, and your browser will ask for permission.
              Audio stays in this tab&apos;s memory so you can play it back. It is never uploaded, and it is discarded
              when you retry, leave this answer, or refresh. Maximum length: {MAX_RECORDING_SECONDS / 60} minutes.
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={start} disabled={state.phase === "requesting"}>
                {state.phase === "requesting" ? "Waiting for permission..." : "Start recording"}
              </button>
              <button className="btn btn-secondary" onClick={continueWithoutRecording}>
                Skip recording, type my answer
              </button>
            </div>
          </>
        )}

        {state.phase === "recording" && (
          <>
            <p className="rec-indicator">
              <span className="rec-dot" aria-hidden="true" /> Recording - microphone on
            </p>
            <p className="timer" role="timer" aria-label="Elapsed time" data-testid="timer">
              {formatClock(elapsed)}
            </p>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={stop}>
                Stop recording
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                Cancel and discard
              </button>
            </div>
          </>
        )}

        {state.phase === "stopped" && (
          <>
            <div className="notice notice-success" role="status">
              <strong>Recording captured: {formatClock(state.durationSeconds)}</strong>
              Microphone is off. This audio is only in this tab and has not been uploaded or saved.
            </div>
            <audio controls src={state.objectUrl} aria-label="Play back your recording" />
            <div className="btn-row">
              <button className="btn btn-primary" onClick={continueWithRecording}>
                Use this answer
              </button>
              <button className="btn btn-secondary" onClick={reset}>
                Retry (discard this recording)
              </button>
            </div>
          </>
        )}

        {state.phase === "error" && (
          <>
            <div className="notice notice-danger" role="alert" data-testid="recorder-error">
              <strong>{state.message}</strong>
              {state.kind === "denied"
                ? "To try again, allow microphone access for this site in your browser's address-bar site settings, then press Try again. You can also continue without recording."
                : "Check that a microphone is connected and not in use by another app, then try again. You can also continue without recording."}
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={start}>
                Try again
              </button>
              <button className="btn btn-secondary" onClick={continueWithoutRecording}>
                Continue without recording
              </button>
            </div>
          </>
        )}

        {state.phase === "unsupported" && (
          <>
            <div className="notice notice-warning" role="alert" data-testid="recorder-unsupported">
              <strong>This browser cannot record audio here.</strong>
              Recording needs a browser with MediaRecorder support (current Chrome, Edge, Firefox or Safari) on a secure
              (https) page. You can still type your answer and get feedback on the text.
            </div>
            <button className="btn btn-primary" onClick={continueWithoutRecording}>
              Type my answer instead
            </button>
          </>
        )}
      </section>

      <div>
        <Link to="/practice" className="btn btn-secondary">
          Choose a different question
        </Link>
      </div>
    </Page>
  );
}
