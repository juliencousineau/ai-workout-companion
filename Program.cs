using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AiWorkoutCompanion.Data;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to accept larger headers (for JWT auth tokens)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestHeadersTotalSize = 131072; // 128KB
    options.Limits.MaxRequestHeaderCount = 100;
});

// Add services
builder.Services.AddControllers();

// Add database - support Railway's PostgreSQL variables
// Debug: Print all DB-related environment variables
Console.WriteLine("=== Database Environment Variables ===");
foreach (System.Collections.DictionaryEntry envVar in Environment.GetEnvironmentVariables())
{
    var key = envVar.Key?.ToString() ?? "";
    if (key.Contains("PG") || key.Contains("DATABASE") || key.Contains("POSTGRES"))
    {
        Console.WriteLine($"  {key} = {(key.Contains("PASSWORD") ? "***" : envVar.Value)}");
    }
}
Console.WriteLine("======================================");

var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL") 
    ?? Environment.GetEnvironmentVariable("DATABASE_PUBLIC_URL");
string connectionString;

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Parse Railway's PostgreSQL URL format: postgres://user:password@host:port/database
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    Console.WriteLine($"Using DATABASE_URL: Host={uri.Host}, Database={uri.AbsolutePath.TrimStart('/')}");
}
else if (!string.IsNullOrEmpty(Environment.GetEnvironmentVariable("PGHOST")))
{
    // Fallback to individual PG* environment variables
    var pgHost = Environment.GetEnvironmentVariable("PGHOST");
    var pgPort = Environment.GetEnvironmentVariable("PGPORT") ?? "5432";
    var pgDatabase = Environment.GetEnvironmentVariable("PGDATABASE") ?? "railway";
    var pgUser = Environment.GetEnvironmentVariable("PGUSER") ?? Environment.GetEnvironmentVariable("POSTGRES_USER");
    var pgPassword = Environment.GetEnvironmentVariable("PGPASSWORD") ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");
    connectionString = $"Host={pgHost};Port={pgPort};Database={pgDatabase};Username={pgUser};Password={pgPassword};SSL Mode=Require;Trust Server Certificate=true";
    Console.WriteLine($"Using PG* variables: Host={pgHost}, Database={pgDatabase}");
}
else
{
    connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Host=localhost;Database=workout_companion;Username=postgres;Password=postgres";
    Console.WriteLine("Using local database connection");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions => 
        npgsqlOptions.EnableRetryOnFailure(3)));

// Add data protection for encryption
builder.Services.AddDataProtection();

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var secretKey = builder.Configuration["Jwt:SecretKey"] 
            ?? throw new InvalidOperationException("JWT secret key not configured");
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

// Enable authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

// Enable API controllers
app.MapControllers();

// Serve index.html as default
app.UseDefaultFiles();

// Serve static files from wwwroot
app.UseStaticFiles();

app.Run();

