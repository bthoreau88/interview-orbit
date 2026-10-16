// @vitest-environment node
import { describe, expect, it } from "vitest";
import { classifyMediaError, formatClock, initialRecorderState, recorderReducer } from "./recorderState";

const stopped = { type: "stopped", durationSeconds: 21.4, objectUrl: "blob:x", mimeType: "audio/webm", sizeBytes: 10 } as const;

describe("recorderReducer", () => {
  it("follows idle -> requesting -> recording -> stopped", () => {
    let s = initialRecorderState(true);
    s = recorderReducer(s, { type: "request" });
    expect(s.phase).toBe("requesting");
    s = recorderReducer(s, { type: "started", at: 1000 });
    expect(s).toEqual({ phase: "recording", startedAt: 1000 });
    s = recorderReducer(s, stopped);
    expect(s.phase).toBe("stopped");
  });

  it("cannot reach recording without a permission request", () => {
    expect(recorderReducer({ phase: "idle" }, { type: "started", at: 1 }).phase).toBe("idle");
  });

  it("ignores a stop that arrives when not recording", () => {
    expect(recorderReducer({ phase: "idle" }, stopped).phase).toBe("idle");
  });

  it("allows retry after a denial", () => {
    const denied = recorderReducer({ phase: "requesting" }, { type: "failed", kind: "denied", message: "m" });
    expect(denied.phase).toBe("error");
    expect(recorderReducer(denied, { type: "request" }).phase).toBe("requesting");
  });

  it("stays unsupported no matter what happens", () => {
    expect(recorderReducer(initialRecorderState(false), { type: "request" }).phase).toBe("unsupported");
  });
});

describe("classifyMediaError", () => {
  it("maps NotAllowedError to denied", () => {
    expect(classifyMediaError(new DOMException("x", "NotAllowedError")).kind).toBe("denied");
  });
  it("maps NotFoundError to no-device", () => {
    expect(classifyMediaError(new DOMException("x", "NotFoundError")).kind).toBe("no-device");
  });
  it("maps anything else to failed", () => {
    expect(classifyMediaError("boom").kind).toBe("failed");
  });
});

describe("formatClock", () => {
  it("formats mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(65.9)).toBe("01:05");
  });
});
