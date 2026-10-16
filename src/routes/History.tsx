import { Link } from "react-router";
import { Page } from "../components/Page";

export function History() {
  return (
    <Page title="History" eyebrow="Saved sessions">
      <section className="glass stack" data-testid="history-empty">
        <h2>No saved sessions</h2>
        <p className="muted">
          Saving is not built yet, so there is nothing to list. When it is added, saved sessions will appear here and you
          will be able to open or delete them.
        </p>
        <Link to="/practice" className="btn btn-primary">
          Start practice
        </Link>
      </section>
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
