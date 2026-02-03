using Microsoft.EntityFrameworkCore;
using AiWorkoutCompanion.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();

// Add database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Database=workout_companion;Username=postgres;Password=postgres";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add data protection for encryption
builder.Services.AddDataProtection();

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Enable API controllers
app.MapControllers();

// Serve index.html as default
app.UseDefaultFiles();

// Serve static files from wwwroot
app.UseStaticFiles();

app.Run();

