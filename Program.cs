using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using AiWorkoutCompanion.Data;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel to accept larger headers and bind to Railway's PORT
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(int.Parse(port));
    options.Limits.MaxRequestHeadersTotalSize = 131072; // 128KB
    options.Limits.MaxRequestHeaderCount = 100;
});

// Add services
builder.Services.AddControllers();

// Add database - support Railway's DATABASE_URL or fall back to config
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
Console.WriteLine($"DEBUG: DATABASE_URL env var = '{databaseUrl ?? "(null)"}'");
Console.WriteLine($"DEBUG: DATABASE_URL length = {databaseUrl?.Length ?? 0}");

string connectionString;

if (!string.IsNullOrEmpty(databaseUrl))
{
    // Parse Railway's PostgreSQL URL format: postgres://user:password@host:port/database
    var uri = new Uri(databaseUrl);
    var userInfo = uri.UserInfo.Split(':');
    connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    Console.WriteLine($"Using DATABASE_URL: Host={uri.Host}, Database={uri.AbsolutePath.TrimStart('/')}");
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

