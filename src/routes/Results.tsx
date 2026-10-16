import { useMemo } from "react";
import { Link } from "react-router";
import { Page } from "../components/Page";
import { SourceBadge } from "../components/SourceBadge";
import {
  analyze,
  FILLER_FLAG_PER_100,
  FILLERS,
  MIN_PACE_DURATION_SECONDS,
  PACE_BAND_WPM,
  SHORT_ANSWER_WORDS,
} from "../domain/analyzer";
import { DEMO_TRANSCRIPT } from "../domain/demoTranscript";
import { findPrompt } from "../domain/prompts";
import type { TranscriptSource } from "../domain/session";
import { formatClock } from "../recorder/recorderState";
import { useDraftSession } from "../state/DraftSession";

export function Results() {
  const { draft, setTranscript } = useDraftSession();
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
          Answers live only in this tab until saving is built, so a refresh clears them. Start a new practice answer to
          see feedback.
        </div>
        <Link to="/practice" className="btn btn-primary">
          Choose a question
        </Link>
      </Page>
    );
  }

  const { source, text } = draft.transcript;
  const chooseSource = (next: TranscriptSource) => {
    if (next === "demo") setTranscript({ source: "demo", text: DEMO_TRANSCRIPT });
    else if (next === "manual") setTranscript({ source: "manual", text: source === "manual" ? text : "" });
    else setTranscript({ source: "none", text: "" });
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
        <fieldset className="source-options">
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
              onChange={(e) => setTranscript({ source: "manual", text: e.target.value })}
              aria-describedby="manual-help"
            />
            <p id="manual-help" className="muted">
              Include filler words like &ldquo;um&rdquo; if you said them. This text stays in this tab.
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
        {analysis.status === "not-scorable" ? (
          <div className="notice notice-info" role="status" data-testid="not-scorable">
            <strong>Not scorable</strong>
            {analysis.reason} No score or word rate is shown, because there is no text to measure.
          </div>
        ) : (
          <>
            {analysis.source === "demo" && (
              <p className="badge badge-demo">Feedback on DEMO SAMPLE text, not on your answer</p>
            )}
            <dl className="metrics">
              <div className="metric">
                <dt>Words</dt>
                <dd data-testid="metric-words">{analysis.totalWords}</dd>
              </div>
              <div className="metric">
                <dt>Filler words</dt>
                <dd data-testid="metric-fillers">
                  {analysis.fillerTotal}
                  <small>
                    {Object.entries(analysis.fillerCounts)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(", ") || "none found"}
                  </small>
                </dd>
              </div>
              <div className="metric">
                <dt>Fillers per 100 words</dt>
                <dd data-testid="metric-filler-rate">{analysis.fillersPer100Words}</dd>
              </div>
              <div className="metric">
                <dt>Estimated pace</dt>
                <dd data-testid="metric-pace">
                  {analysis.pace.status === "calculated" ? (
                    <>
                      {analysis.pace.wordsPerMinute}
                      <small>words per minute</small>
                    </>
                  ) : (
                    <>
                      -<small>{analysis.pace.reason}</small>
                    </>
                  )}
                </dd>
              </div>
            </dl>
            <h3>Suggestions</h3>
            {analysis.tips.length === 0 ? (
              <p className="muted">No rule-based flags were triggered.</p>
            ) : (
              <ul>
                {analysis.tips.map((t) => (
                  <li key={t.rule}>
                    {t.message} <span className="rule">(rule: {t.rule})</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <details>
          <summary>How these numbers are calculated</summary>
          <ul>
            <li>Words: runs of letters or digits; punctuation ignored; &ldquo;don&apos;t&rdquo; counts as one word.</li>
            <li>
              Filler words: {FILLERS.map((f) => f.label).join(", ")}. Repeated letters count the same
              (&ldquo;ummm&rdquo; = um). Words like &ldquo;like&rdquo; are not counted because they are often meaningful.
            </li>
            <li>Fillers per 100 words = filler words / words × 100, rounded to one decimal.</li>
            <li>
              Estimated pace = words / (recording seconds / 60). Calculated only for text you typed (or a live
              transcript) with a recording of at least {MIN_PACE_DURATION_SECONDS} seconds. It is an estimate because
              typed text may not match exactly what you said.
            </li>
            <li>
              Suggestion rules: more than {FILLER_FLAG_PER_100} fillers per 100 words; fewer than {SHORT_ANSWER_WORDS}{" "}
              words; pace outside {PACE_BAND_WPM.min}-{PACE_BAND_WPM.max} words per minute (a reference range chosen for
              this prototype, not a research standard).
            </li>
            <li>There is no overall score. Nothing here uses AI.</li>
          </ul>
          <p className="rule">Analyzer version: {analysis.version}</p>
        </details>
      </section>

      <section className="glass stack" aria-labelledby="save-heading">
        <h2 id="save-heading">Save</h2>
        <div className="notice notice-warning" data-testid="save-unavailable">
          <strong>Saving is not built yet.</strong>
          Saving to History is planned for the next milestone. Right now nothing on this page is stored, and a refresh
          discards it.
        </div>
        <div className="btn-row">
          <button className="btn btn-secondary" disabled>
            Save session (coming next)
          </button>
          <Link to="/practice" className="btn btn-primary">
            Practice another question
          </Link>
        </div>
      </section>
    </Page>
  );
}
