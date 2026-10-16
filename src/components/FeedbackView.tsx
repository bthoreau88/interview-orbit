import {
  FILLER_FLAG_PER_100,
  FILLERS,
  MIN_PACE_DURATION_SECONDS,
  PACE_BAND_WPM,
  SHORT_ANSWER_WORDS,
  type Analysis,
} from "../domain/analyzer";

/** Renders an Analysis (live on Results, or read back from storage on the session detail screen). */
export function FeedbackView({ analysis }: { analysis: Analysis }) {
  return (
    <>
      {analysis.status === "not-scorable" ? (
        <div className="notice notice-info" role="status" data-testid="not-scorable">
          <strong>Not scorable</strong>
          {analysis.reason} No score or word rate is shown, because there is no text to measure.
        </div>
      ) : (
        <>
          {analysis.source === "demo" && <p className="badge badge-demo">Feedback on DEMO SAMPLE text, not on your answer</p>}
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
            Filler words: {FILLERS.map((f) => f.label).join(", ")}. Repeated letters count the same (&ldquo;ummm&rdquo; =
            um). Words like &ldquo;like&rdquo; are not counted because they are often meaningful.
          </li>
          <li>Fillers per 100 words = filler words / words × 100, rounded to one decimal.</li>
          <li>
            Estimated pace = words / (recording seconds / 60). Calculated only for text you typed (or a live transcript)
            with a recording of at least {MIN_PACE_DURATION_SECONDS} seconds. It is an estimate because typed text may not
            match exactly what you said.
          </li>
          <li>
            Suggestion rules: more than {FILLER_FLAG_PER_100} fillers per 100 words; fewer than {SHORT_ANSWER_WORDS} words;
            pace outside {PACE_BAND_WPM.min}-{PACE_BAND_WPM.max} words per minute (a reference range chosen for this
            prototype, not a research standard).
          </li>
          <li>There is no overall score. Nothing here uses AI.</li>
        </ul>
        <p className="rule">Analyzer version: {analysis.version}</p>
      </details>
    </>
  );
}
