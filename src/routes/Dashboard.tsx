import { Link } from "react-router";
import { OrbitWordmark } from "../components/OrbitWordmark";
import { Page } from "../components/Page";
import { findPrompt, PROMPTS } from "../domain/prompts";
import { formatWhen, SessionSummary, useSessionList } from "./History";

export function Dashboard() {
  const { state } = useSessionList();

  return (
    <Page title="Your next interview starts here." eyebrow="Ready to practice">
      <div className="grid">
        <section className="glass stack" aria-labelledby="start-heading">
          <OrbitWordmark variant="hero" />
          <h2 id="start-heading">Practice one answer</h2>
          <p className="muted">
            Pick a question, record your answer, and get rule-based feedback you can check yourself.
          </p>
          <div className="btn-row">
            <Link to="/practice" className="btn btn-primary">
              Start practice <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
        <div className="stack">
          <section className="glass" aria-labelledby="catalog-heading">
            <p className="eyebrow" id="catalog-heading">
              Question catalog
            </p>
            <p className="timer" style={{ fontSize: "3rem" }}>
              {String(PROMPTS.length).padStart(2, "0")}
            </p>
            <p className="muted">curated prompts available</p>
          </section>
          <section className="glass stack" aria-labelledby="recent-heading" data-testid="recent">
            <h2 id="recent-heading">Recent sessions</h2>
            {state.phase === "loading" && <p className="muted">Loading...</p>}
            {state.phase === "error" && (
              <p className="notice notice-danger" role="alert">
                <strong>Saved sessions could not be loaded.</strong>
                {state.message}
              </p>
            )}
            {state.phase === "ready" && state.value.sessions.length === 0 && (
              <p className="muted" data-testid="recent-empty">
                No saved sessions yet. Save an answer from the Results screen and it will appear here.
              </p>
            )}
            {state.phase === "ready" && state.value.sessions.length > 0 && (
              <>
                <ul className="prompt-list stack">
                  {state.value.sessions.slice(0, 3).map((s) => (
                    <li key={s.id}>
                      <Link to={`/history/${s.id}`} className="recent-link">
                        <span className="eyebrow">{formatWhen(s.createdAt)}</span>
                        <span>{findPrompt(s.promptId)?.text ?? `Unknown question (${s.promptId})`}</span>
                        <SessionSummary session={s} />
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link to="/history">See all {state.value.sessions.length} in History</Link>
              </>
            )}
          </section>
        </div>
      </div>
    </Page>
  );
}
