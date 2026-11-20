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
