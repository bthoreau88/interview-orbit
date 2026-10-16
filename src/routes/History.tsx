import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Page } from "../components/Page";
import { SourceBadge } from "../components/SourceBadge";
import { findPrompt } from "../domain/prompts";
import type { InterviewSession } from "../domain/session";
import { readStoredAnalysis } from "../domain/sessionFactory";
import { storageErrorMessage } from "../domain/sessionRepository";
import { formatClock } from "../recorder/recorderState";
import { useSessionRepository } from "../state/SessionRepository";

export type LoadState<T> = { phase: "loading" } | { phase: "ready"; value: T } | { phase: "error"; message: string };

export function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function useSessionList() {
  const repository = useSessionRepository();
  const [state, setState] = useState<LoadState<{ sessions: InterviewSession[]; skippedInvalid: number }>>({
    phase: "loading",
  });
  const load = useCallback(() => {
    let active = true;
    setState({ phase: "loading" });
    repository
      .list()
      .then((value) => active && setState({ phase: "ready", value }))
      .catch((error: unknown) => active && setState({ phase: "error", message: storageErrorMessage(error) }));
    return () => {
      active = false;
    };
  }, [repository]);
  useEffect(() => load(), [load]);
  return { state, reload: load, storageLabel: repository.storageLabel };
}

export function SessionSummary({ session }: { session: InterviewSession }) {
  const analysis = readStoredAnalysis(session.feedbackJson);
  if (!analysis) return <span className="muted">Feedback data unreadable</span>;
  if (analysis.status === "not-scorable") return <span className="muted">Not scorable</span>;
  return (
    <span className="mono">
      {analysis.totalWords} words · {analysis.fillerTotal} fillers
    </span>
  );
}

export function History() {
  const { state, reload, storageLabel } = useSessionList();
  const location = useLocation();
  const deleted = (location.state as { deleted?: boolean } | null)?.deleted === true;

  return (
    <Page title="History" eyebrow="Saved sessions">
      <p className="muted" data-testid="storage-label">
        {storageLabel}
      </p>
      {deleted && (
        <div className="notice notice-success" role="status" data-testid="deleted-notice">
          <strong>Session deleted.</strong>
          It has been removed from this browser&apos;s storage.
        </div>
      )}

      {state.phase === "loading" && (
        <p className="muted" role="status">
          Loading saved sessions...
        </p>
      )}

      {state.phase === "error" && (
        <div className="stack">
          <div className="notice notice-danger" role="alert" data-testid="history-error">
            <strong>Could not load History.</strong>
            {state.message}
          </div>
          <button className="btn btn-secondary" onClick={reload}>
            Try again
          </button>
        </div>
      )}

      {state.phase === "ready" && state.value.skippedInvalid > 0 && (
        <div className="notice notice-warning" role="status">
          <strong>
            {state.value.skippedInvalid} stored record{state.value.skippedInvalid === 1 ? " was" : "s were"} unreadable and
            {state.value.skippedInvalid === 1 ? " is" : " are"} not shown.
          </strong>
        </div>
      )}

      {state.phase === "ready" && state.value.sessions.length === 0 && (
        <section className="glass stack" data-testid="history-empty">
          <h2>No saved sessions</h2>
          <p className="muted">Practice a question and press Save session on the Results screen. It will appear here.</p>
          <Link to="/practice" className="btn btn-primary">
            Start practice
          </Link>
        </section>
      )}

      {state.phase === "ready" && state.value.sessions.length > 0 && (
        <ul className="prompt-list stack" data-testid="history-list">
          {state.value.sessions.map((s) => {
            const prompt = findPrompt(s.promptId);
            const when = formatWhen(s.createdAt);
            return (
              <li key={s.id}>
                <article className="glass stack" aria-labelledby={`h-${s.id}`}>
                  <p className="eyebrow">
                    <time dateTime={s.createdAt}>{when}</time>
                  </p>
                  <p id={`h-${s.id}`} style={{ fontWeight: 600 }}>
                    {prompt ? prompt.text : `Unknown question (${s.promptId})`}
                  </p>
                  <p className="btn-row" style={{ alignItems: "center" }}>
                    <SourceBadge source={s.transcriptSource} />
                    <SessionSummary session={s} />
                    <span className="mono">
                      {s.durationSeconds === null ? "no recording" : formatClock(s.durationSeconds)}
                    </span>
                  </p>
                  <div>
                    <Link to={`/history/${s.id}`} className="btn btn-secondary" aria-label={`Open session from ${when}`}>
                      Open
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}

export function NotFound() {
  return (
    <Page title="Page not found">
      <p className="muted">That address does not match any screen.</p>
      <Link to="/" className="btn btn-primary">
        Go to the home screen
      </Link>
    </Page>
  );
}
