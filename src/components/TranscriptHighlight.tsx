import { FILLERS } from "../domain/analyzer";

/** Read-only view of a transcript with filler words highlighted, using the analyzer's own filler list. */
export function TranscriptHighlight({ text }: { text: string }) {
  const parts = text.split(/(\s+)/);
  return (
    <p className="transcript-highlight" data-testid="transcript-highlight">
      {parts.map((part, i) => {
        const word = part.toLowerCase().replace(/[^a-z']/g, "");
        return word && FILLERS.some((f) => f.pattern.test(word)) ? (
          <mark key={i} data-testid="filler-mark">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </p>
  );
}
