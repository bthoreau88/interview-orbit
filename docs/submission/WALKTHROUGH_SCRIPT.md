# Interview Orbit: Walkthrough Script (target 3:00, limit 2:00–4:00)

For the narrated screen recording (submission artifact 07). Read the **Say** lines; do the **Do** lines.
Times are cumulative. Rehearse once with a real microphone before recording.

## Before you record

- Run `npm run dev` in `projects/intervieworbit` and open `http://localhost:5173` in Chrome or Edge.
- Clear old data: DevTools → Application → Storage → Clear site data. History must start empty.
- Reset the microphone permission for localhost so the browser prompt appears on camera.
- Have the repository open in a second window at `docs/architecture/diagrams/02-containers-components.png`.
- Close notifications. Use a 1280 px wide window.

## Script

**0:00 – Opening (15 s)**
Do: Dashboard on screen.
Say: "This is Interview Orbit, an interview-practice app I built for Software Architecture. You choose a
question, record an answer, get rule-based feedback you can check, and save the session. I'll show the full path,
two failure cases, and how the code is organised."

**0:15 – Practice (15 s)**
Do: Start practice → choose the Teamwork filter → "Answer this" on the disagreement question.
Say: "There are eight curated prompts. The question I pick carries through to the recorder and the results."

**0:30 – Consent and recording (30 s)**
Do: Point at the consent notice. Start recording → allow the mic in the browser prompt → answer for about
20 seconds, including one "um" → Stop.
Say: "The microphone only turns on when I press Start, and the browser asks first. The audio stays in this tab
for playback. It's never uploaded or saved."

**1:00 – Results and provenance (35 s)**
Do: Use this answer → point at the disabled "Live transcription" option → choose "Type what you said" → type
the answer, including "um" → scroll to Feedback → open "How these numbers are calculated".
Say: "There's no speech-to-text in this build, and the app says so instead of faking it. I type what I said.
Every number is from a published formula: words, filler words, and an estimated pace from my words over the
measured recording time. There's no AI score."

**1:35 – Save, refresh, reopen (25 s)**
Do: Save session → point at "Saved" → refresh the browser → History → Open.
Say: "Save only reports success after the record is written and read back from the browser's database. After a
refresh, the session is still here with its source label and the same numbers. Storage is in this browser, not on
a server; the app states that."

**2:00 – Failure cases (25 s)**
Do: Delete session → show the confirmation with Cancel focused → Yes, delete → History is empty.
Then open Practice → any question → Start recording → block the microphone in the browser prompt.
Say: "Delete asks first and removes the record. If I block the microphone, I get a recovery screen with steps,
not a spinner or a fake success."

**2:25 – Architecture (30 s)**
Do: Switch to the container diagram.
Say: "The app is layered. The domain core, which holds the analyzer and the session rules, has no React,
browser, or storage code. Storage sits behind an interface with an IndexedDB adapter today; a server API is
specified to plug into the same interface. An automated test fails the build if those rules are broken. Three ADRs
record the decisions: the layering and storage, honest transcript sources, and accessible glass styling."

**2:55 – Close (10 s)**
Say: "It's tested with 62 unit tests and 30 end-to-end runs at desktop and phone width, including accessibility
scans. The repository has the diagrams, ADRs, data contract and test report. Thanks for watching."

## If something goes wrong while recording

- Mic prompt does not appear: the permission is remembered. Reset it (padlock icon → Site settings) and restart
  the take.
- A real failure happens: keep it in only if you explain it; never edit a failure to look like a success.
