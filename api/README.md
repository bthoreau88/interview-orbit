# Interview Orbit API

ASP.NET Core 9 Web API for Interview Orbit (BTHOR-3). The SDK version is pinned in `global.json`.

## Run
```
dotnet run --project InterviewOrbit.Api
```
Then open `http://localhost:<port>/health` (the port is printed on startup). It returns `{"status":"ok"}`.

## Test
```
dotnet test
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Liveness check, returns 200 `{"status":"ok"}` |
| POST | `/api/transcriptions` | multipart `audio` file + `durationSeconds`; returns `{ text, words[], source: "live" }` with filler words kept. 413 over 10 MB or 180 s, 400 without audio, 502 if the provider is unavailable (the app then falls back to manual entry) |

## Speech-to-text key (local)
The key is never committed. Store it with user-secrets:
```
dotnet user-secrets init --project InterviewOrbit.Api
dotnet user-secrets set "Deepgram:ApiKey" "<your key>" --project InterviewOrbit.Api
```
When hosted, set the environment variable `Deepgram__ApiKey` instead.

Audio is held in memory only (uploads up to the 10 MB limit are never buffered to a temp file), sent to the provider, and cleared when the request ends. A test checks for temp files while transcription is in progress.
