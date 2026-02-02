var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Serve index.html as default
app.UseDefaultFiles();

// Serve static files from wwwroot
app.UseStaticFiles();

app.Run();
