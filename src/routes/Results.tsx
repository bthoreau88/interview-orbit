import { useMemo, useState } from "react";
import { Link } from "react-router";
import { FeedbackView } from "../components/FeedbackView";
import { Page } from "../components/Page";
import { SourceBadge } from "../components/SourceBadge";
import { analyze } from "../domain/analyzer";
import { DEMO_TRANSCRIPT } from "../domain/demoTranscript";
import { findPrompt } from "../domain/prompts";
import type { TranscriptSource } from "../domain/session";
import { createSession } from "../domain/sessionFactory";
import { storageErrorMessage } from "../domain/sessionRepository";
import { formatClock } from "../recorder/recorderState";
import { useDraftSession } from "../state/DraftSession";
import { newSessionId, useSessionRepository } from "../state/SessionRepository";

type SaveState = { phase: "idle" } | { phase: "saving" } | { phase: "error"; message: string };

export function Results() {
  const { draft, setTranscript, markSaved } = useDraftSession();
  const repository = useSessionRepository();
  const [save, setSave] = useState<SaveState>({ phase: "idle" });
  const prompt = findPrompt(draft?.promptId);

  const analysis = useMemo(
    () =>
      draft
        ? analyze({
            text: draft.transcript.text,
            source: draft.transcript.source,
            durationSeconds: draft.recording?.durationSeconds ?? null,
          })
        : null,
    [draft],
  );

  if (!draft || !prompt || !analysis) {
    return (
      <Page title="Nothing to review yet" eyebrow="Results">
        <div className="notice notice-info" role="status" data-testid="results-empty">
          <strong>There is no answer in progress.</strong>
          An answer stays in this tab until you save it, so a refresh before saving clears it. Saved answers are in
          History.
        </div>
        <div className="btn-row">
          <Link to="/practice" className="btn btn-primary">
            Choose a question
          </Link>
          <Link to="/history" className="btn btn-secondary">
            Open History
          </Link>
        </div>
      </Page>
    );
  }

  const savedId = draft.savedId;
  const locked = save.phase === "saving" || savedId !== undefined;
  const { source, text } = draft.transcript;
  const chooseSource = (next: TranscriptSource) => {
    if (next === "demo") setTranscript({ source: "demo", text: DEMO_TRANSCRIPT });
    else if (next === "manual") setTranscript({ source: "manual", text: source === "manual" ? text : "" });
    else setTranscript({ source: "none", text: "" });
  };

  const onSave = async () => {
    setSave({ phase: "saving" });
    try {
      const session = createSession({
        id: newSessionId(),
        now: new Date(),
        promptId: draft.promptId,
        durationSeconds: draft.recording?.durationSeconds ?? null,
        transcript: draft.transcript,
        analysis,
      });
      const stored = await repository.save(session);
      markSaved(stored.id);
      setSave({ phase: "idle" });
    } catch (error) {
      setSave({ phase: "error", message: storageErrorMessage(error) });
    }
  };

  return (
    <Page title="Review your answer" eyebrow="Results">
      <section className="glass stack" aria-labelledby="answer-heading">
        <h2 id="answer-heading">Your attempt</h2>
        <p data-testid="results-prompt">
          <span className="muted">Question: </span>
          {prompt.text}
        </p>
        {draft.recording ? (
          <>
            <p>
              <span className="muted">Recording length (measured): </span>
              <span className="mono" data-testid="results-duration">
                {formatClock(draft.recording.durationSeconds)}
              </span>
            </p>
            <audio controls src={draft.recording.objectUrl} aria-label="Play back your recording" />
          </>
        ) : (
          <p className="muted" data-testid="results-no-recording">
            No recording for this attempt.
          </p>
        )}
      </section>

      <section className="glass stack" aria-labelledby="transcript-heading">
        <h2 id="transcript-heading">Transcript</h2>
        <fieldset className="source-options" disabled={locked}>
          <legend className="muted" style={{ marginBottom: 8 }}>
            Where should the text come from?
          </legend>
          <label className="source-option" data-disabled="true">
            <input type="radio" name="source" disabled aria-describedby="live-why" />
            <span>
              <strong>Live transcription - unavailable</strong>
              <br />
              <span className="muted" id="live-why">
                No speech-to-text provider is connected in this build. Browser speech services can send audio to a third
                party, so they are off by design.
              </span>
            </span>
          </label>
          <label className="source-option">
            <input type="radio" name="source" checked={source === "manual"} onChange={() => chooseSource("manual")} />
            <span>
              <strong>Type what you said</strong>
              <br />
              <span className="muted">Manual. Pace is estimated from your typed words over the recording length.</span>
            </span>
          </label>
          <label className="source-option">
            <input type="radio" name="source" checked={source === "demo"} onChange={() => chooseSource("demo")} />
            <span>
              <strong>Use a demo sample</strong>
              <br />
              <span className="muted">A fixed example text, unrelated to your recording. Shows how feedback works.</span>
            </span>
          </label>
          <label className="source-option">
            <input type="radio" name="source" checked={source === "none"} onChange={() => chooseSource("none")} />
            <span>
              <strong>No transcript</strong>
            </span>
          </label>
        </fieldset>

        <SourceBadge source={source} />

        {source === "demo" && (
          <div className="notice notice-warning" role="note" data-testid="demo-warning">
            <strong>DEMO / SAMPLE - NOT TRANSCRIBED FROM THIS RECORDING</strong>
            This text is the same for everyone and was not produced from your audio. Its feedback describes the sample,
            not your answer.
          </div>
        )}
        {source === "manual" && (
          <div>
            <label htmlFor="manual-text" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Your answer, as you said it
            </label>
            <textarea
              id="manual-text"
              value={text}
              readOnly={locked}
              onChange={(e) => setTranscript({ source: "manual", text: e.target.value })}
              aria-describedby="manual-help"
            />
            <p id="manual-help" className="muted">
              Include filler words like &ldquo;um&rdquo; if you said them.
            </p>
          </div>
        )}
        {source === "demo" && (
          <blockquote className="notice notice-info" style={{ margin: 0 }} data-testid="demo-text">
            {text}
          </blockquote>
        )}
      </section>

      <section className="glass stack" aria-labelledby="feedback-heading" data-testid="feedback">
        <h2 id="feedback-heading">Feedback</h2>
        <FeedbackView analysis={analysis} />
      </section>

      <section className="glass stack" aria-labelledby="save-heading">
        <h2 id="save-heading">Save</h2>
        <p className="muted" data-testid="storage-label">
          {repository.storageLabel} Saved: the question, measured length, transcript source and text, and the feedback
          numbers.
        </p>
        <div aria-live="polite">
          {savedId !== undefined && (
            <div className="notice notice-success" data-testid="save-success">
              <strong>Saved</strong>
              Stored and read back from browser storage. Reference <span className="mono">{savedId.slice(0, 8)}</span>.
              This attempt is now read-only.
            </div>
          )}
          {save.phase === "error" && (
            <div className="notice notice-danger" role="alert" data-testid="save-error">
              <strong>Not saved</strong>
              {save.message} Your answer is still on this screen; you can try again.
            </div>
          )}
        </div>
        <div className="btn-row">
          {savedId !== undefined ? (
            <Link to={`/history/${savedId}`} className="btn btn-primary">
              Open in History
            </Link>
          ) : (
            <button className="btn btn-primary" onClick={onSave} disabled={save.phase === "saving"}>
              {save.phase === "saving" ? "Saving..." : save.phase === "error" ? "Try saving again" : "Save session"}
            </button>
          )}
          <Link to="/practice" className="btn btn-secondary">
            Practice another question
          </Link>
        </div>
      </section>
    </Page>
  );
}
