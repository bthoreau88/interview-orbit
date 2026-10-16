import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { FeedbackView } from "../components/FeedbackView";
import { Page } from "../components/Page";
import { SourceBadge } from "../components/SourceBadge";
import { findPrompt } from "../domain/prompts";
import type { InterviewSession } from "../domain/session";
import { readStoredAnalysis } from "../domain/sessionFactory";
import { storageErrorMessage } from "../domain/sessionRepository";
import { formatClock } from "../recorder/recorderState";
import { useSessionRepository } from "../state/SessionRepository";
import { formatWhen, type LoadState } from "./History";

export function SessionDetail() {
  const { sessionId = "" } = useParams();
  const repository = useSessionRepository();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState<InterviewSession | null>>({ phase: "loading" });
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  /** Opens the confirm dialog with focus on the safe choice, never on the destructive one. */
  const openConfirm = () => {
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  };

  useEffect(() => {
    let active = true;
    setState({ phase: "loading" });
    repository
      .get(sessionId)
      .then((value) => active && setState({ phase: "ready", value }))
      .catch((error: unknown) => active && setState({ phase: "error", message: storageErrorMessage(error) }));
    return () => {
      active = false;
    };
  }, [repository, sessionId]);

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await repository.remove(sessionId);
      dialogRef.current?.close();
      navigate("/history", { replace: true, state: { deleted: true } });
    } catch (error) {
      dialogRef.current?.close();
      setDeleteError(storageErrorMessage(error));
      setDeleting(false);
    }
  };

  if (state.phase === "loading") {
    return (
      <Page title="Saved session" eyebrow="History">
        <p className="muted" role="status">
          Loading...
        </p>
      </Page>
    );
  }

  if (state.phase === "error" || state.value === null) {
    return (
      <Page title="Session unavailable" eyebrow="History">
        <div className="notice notice-danger" role="alert" data-testid="detail-error">
          <strong>{state.phase === "error" ? "Could not load this session." : "This session was not found."}</strong>
          {state.phase === "error" ? state.message : "It may have been deleted, or it was saved in a different browser."}
        </div>
        <Link to="/history" className="btn btn-primary">
          Back to History
        </Link>
      </Page>
    );
  }

  const session = state.value;
  const prompt = findPrompt(session.promptId);
  const analysis = readStoredAnalysis(session.feedbackJson);

  return (
    <Page title="Saved session" eyebrow="History">
      <section className="glass stack" aria-labelledby="detail-heading">
        <h2 id="detail-heading">Attempt</h2>
        <p>
          <span className="muted">Saved: </span>
          <time dateTime={session.createdAt} data-testid="detail-when">
            {formatWhen(session.createdAt)}
          </time>
        </p>
        <p data-testid="detail-prompt">
          <span className="muted">Question: </span>
          {prompt ? prompt.text : `Unknown question (${session.promptId})`}
        </p>
        <p>
          <span className="muted">Recording length (measured): </span>
          <span className="mono" data-testid="detail-duration">
            {session.durationSeconds === null ? "no recording" : formatClock(session.durationSeconds)}
          </span>
          <span className="muted"> - audio is never saved</span>
        </p>
        <p className="mono rule">Reference {session.id}</p>
      </section>

      <section className="glass stack" aria-labelledby="detail-transcript">
        <h2 id="detail-transcript">Transcript</h2>
        <SourceBadge source={session.transcriptSource} />
        {session.transcriptSource === "demo" && (
          <div className="notice notice-warning" role="note">
            <strong>DEMO / SAMPLE - NOT TRANSCRIBED FROM THIS RECORDING</strong>
            This text was a fixed sample, not your answer.
          </div>
        )}
        {session.transcriptText ? (
          <blockquote className="notice notice-info" style={{ margin: 0, whiteSpace: "pre-wrap" }} data-testid="detail-text">
            {session.transcriptText}
          </blockquote>
        ) : (
          <p className="muted">No transcript text was saved.</p>
        )}
      </section>

      <section className="glass stack" aria-labelledby="detail-feedback" data-testid="feedback">
        <h2 id="detail-feedback">Feedback</h2>
        {analysis ? (
          <FeedbackView analysis={analysis} />
        ) : (
          <div className="notice notice-warning" role="status">
            <strong>Feedback cannot be displayed.</strong>
            It was saved by a different analyzer version or is damaged. The rest of the session is shown above.
          </div>
        )}
      </section>

      <section className="glass stack" aria-labelledby="detail-delete">
        <h2 id="detail-delete">Delete</h2>
        <p className="muted">Deleting removes this session from this browser&apos;s storage. It cannot be undone.</p>
        {deleteError && (
          <div className="notice notice-danger" role="alert" data-testid="delete-error">
            <strong>Not deleted.</strong>
            {deleteError}
          </div>
        )}
        <div className="btn-row">
          <button className="btn btn-danger" onClick={openConfirm}>
            Delete session
          </button>
          <Link to="/history" className="btn btn-secondary">
            Back to History
          </Link>
        </div>
      </section>

      <dialog ref={dialogRef} className="glass dialog" aria-labelledby="confirm-title" aria-describedby="confirm-body">
        <h2 id="confirm-title">Delete this session?</h2>
        <p id="confirm-body">This permanently removes it from this browser. This cannot be undone.</p>
        <div className="btn-row">
          <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Yes, delete"}
          </button>
          <button ref={cancelRef} className="btn btn-secondary" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
        </div>
      </dialog>
    </Page>
  );
}
