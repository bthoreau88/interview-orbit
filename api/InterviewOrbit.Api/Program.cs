var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Liveness check used by local runs, CI and the hosting platform.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.Run();

// Exposed so the test project can host the API with WebApplicationFactory.
public partial class Program { }
