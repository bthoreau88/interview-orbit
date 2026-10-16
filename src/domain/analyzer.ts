import type { TranscriptSource } from "./session";

/**
 * Deterministic, rule-based feedback. No AI and no hidden scoring: every number
 * on the Results screen comes from the formulas documented in this file.
 *
 * Tokenization: lowercase; curly apostrophes become straight; a word is a run
 * of letters/digits, optionally joined by an apostrophe ("don't" = 1 word).
 * Punctuation is ignored.
 */
export const ANALYZER_VERSION = "io-analyzer/1";

/** Declared filler lexicon. Repeated letters count as the same filler ("ummm" = um). */
export const FILLERS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "um", pattern: /^u+m+$/ },
  { label: "uh", pattern: /^u+h+$/ },
  { label: "er", pattern: /^e+r+m*$/ },
  { label: "ah", pattern: /^a+h+$/ },
  { label: "hmm", pattern: /^h+m+$/ },
];

/** Reference band for this prototype. A product choice, not a research standard. */
export const PACE_BAND_WPM = { min: 110, max: 170 } as const;
export const MIN_PACE_DURATION_SECONDS = 10;
export const SHORT_ANSWER_WORDS = 75;
export const FILLER_FLAG_PER_100 = 5;

export interface AnalysisInput {
  text: string;
  source: TranscriptSource;
  /** Measured recording length, or null when there was no recording. */
  durationSeconds: number | null;
}

export type PaceResult =
  | { status: "calculated"; wordsPerMinute: number }
  | { status: "not-calculated"; reason: string };

export interface Tip {
  rule: string;
  message: string;
}

export type Analysis =
  | {
      status: "not-scorable";
      version: string;
      reason: string;
    }
  | {
      status: "complete";
      version: string;
      source: TranscriptSource;
      totalWords: number;
      fillerTotal: number;
      fillerCounts: Record<string, number>;
      fillersPer100Words: number;
      pace: PaceResult;
      tips: Tip[];
    };

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[‘’]/g, "'").match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) ?? [];
}

export function countFillers(words: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const word of words) {
    const filler = FILLERS.find((f) => f.pattern.test(word));
    if (filler) counts[filler.label] = (counts[filler.label] ?? 0) + 1;
  }
  return counts;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function paceFor(input: AnalysisInput, totalWords: number): PaceResult {
  if (input.source !== "manual" && input.source !== "live") {
    return {
      status: "not-calculated",
      reason: "Pace needs the words you actually said. Demo text is not synchronized with your recording.",
    };
  }
  if (input.durationSeconds === null) {
    return { status: "not-calculated", reason: "There is no recording, so there is no measured duration." };
  }
  if (input.durationSeconds < MIN_PACE_DURATION_SECONDS) {
    return {
      status: "not-calculated",
      reason: `The recording is shorter than ${MIN_PACE_DURATION_SECONDS} seconds, which is too short for a stable rate.`,
    };
  }
  return { status: "calculated", wordsPerMinute: Math.round(totalWords / (input.durationSeconds / 60)) };
}

export function analyze(input: AnalysisInput): Analysis {
  if (input.source === "none") {
    return { status: "not-scorable", version: ANALYZER_VERSION, reason: "No transcript was provided." };
  }
  const words = tokenize(input.text);
  if (words.length === 0) {
    return {
      status: "not-scorable",
      version: ANALYZER_VERSION,
      reason: "The transcript is empty, so there is nothing to measure.",
    };
  }

  const fillerCounts = countFillers(words);
  const fillerTotal = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
  const fillersPer100Words = round1((fillerTotal / words.length) * 100);
  const pace = paceFor(input, words.length);

  const tips: Tip[] = [];
  if (fillersPer100Words > FILLER_FLAG_PER_100) {
    tips.push({
      rule: `fillers per 100 words > ${FILLER_FLAG_PER_100}`,
      message: "Try replacing filler words with a short silent pause while you think.",
    });
  }
  if (words.length < SHORT_ANSWER_WORDS) {
    tips.push({
      rule: `total words < ${SHORT_ANSWER_WORDS}`,
      message: "This answer is short. Behavioral answers usually cover the situation, your action, and the result.",
    });
  }
  if (pace.status === "calculated" && pace.wordsPerMinute > PACE_BAND_WPM.max) {
    tips.push({
      rule: `pace > ${PACE_BAND_WPM.max} words/min`,
      message: "You may be speaking quickly. Slow down slightly on key points.",
    });
  }
  if (pace.status === "calculated" && pace.wordsPerMinute < PACE_BAND_WPM.min) {
    tips.push({
      rule: `pace < ${PACE_BAND_WPM.min} words/min`,
      message: "Your pace is relaxed. Check for long pauses or tighten the opening.",
    });
  }

  return {
    status: "complete",
    version: ANALYZER_VERSION,
    source: input.source,
    totalWords: words.length,
    fillerTotal,
    fillerCounts,
    fillersPer100Words,
    pace,
    tips,
  };
}
