import { Link } from "react-router";
import { OrbitWordmark } from "../components/OrbitWordmark";
import { Page } from "../components/Page";
import { PROMPTS } from "../domain/prompts";

export function Dashboard() {
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
          <section className="glass" aria-labelledby="recent-heading">
            <h2 id="recent-heading">Recent sessions</h2>
            <p className="muted" data-testid="recent-empty">
              No saved sessions yet. Saving to History is not built yet, so nothing is stored. It is planned for the next
              milestone.
            </p>
          </section>
        </div>
      </div>
    </Page>
  );
}
