import { SOURCE_LABELS, type TranscriptSource } from "../domain/session";

const ICON: Record<TranscriptSource, string> = { live: "●", manual: "✎", demo: "⚠", none: "∅" };

export function SourceBadge({ source }: { source: TranscriptSource }) {
  return (
    <span className={`badge badge-${source}`} data-testid="source-badge">
      <span aria-hidden="true">{ICON[source]}</span>
      <span>Source: {SOURCE_LABELS[source]}</span>
    </span>
  );
}
