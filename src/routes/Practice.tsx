import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Page } from "../components/Page";
import { PROMPT_CATEGORIES, PROMPTS, type PromptCategory } from "../domain/prompts";

type Filter = "All" | PromptCategory;

export function Practice() {
  const [filter, setFilter] = useState<Filter>("All");
  const visible = useMemo(() => (filter === "All" ? PROMPTS : PROMPTS.filter((p) => p.category === filter)), [filter]);

  return (
    <Page title="Choose a question" eyebrow="Practice">
      <fieldset className="chips">
        <legend className="visually-hidden">Filter by category</legend>
        {(["All", ...PROMPT_CATEGORIES] as Filter[]).map((c) => (
          <label className="chip" key={c}>
            <input type="radio" name="category" value={c} checked={filter === c} onChange={() => setFilter(c)} />
            <span>{c}</span>
          </label>
        ))}
      </fieldset>

      <p className="muted" aria-live="polite">
        Showing {visible.length} of {PROMPTS.length} questions.
      </p>

      {visible.length === 0 ? (
        <div className="notice notice-info" role="status">
          <strong>No questions in this category.</strong>
          Choose another category to continue.
        </div>
      ) : (
        <ul className="prompt-list grid">
          {visible.map((p) => (
            <li key={p.id}>
              <article className="glass prompt-card" aria-labelledby={`q-${p.id}`}>
                <p className="eyebrow">{p.category}</p>
                <p className="prompt-text" id={`q-${p.id}`}>
                  {p.text}
                </p>
                <p className="muted">{p.hint}</p>
                <div className="btn-row" style={{ marginTop: "auto" }}>
                  <Link to={`/record/${p.id}`} className="btn btn-primary" aria-describedby={`q-${p.id}`}>
                    Answer this
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
