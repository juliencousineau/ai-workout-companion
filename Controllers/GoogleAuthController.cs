using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;
using AiWorkoutCompanion.Data;
using AiWorkoutCompanion.Models;

namespace AiWorkoutCompanion.Controllers;

[ApiController]
[Route("api/auth")]
public class GoogleAuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<GoogleAuthController> _logger;

    public GoogleAuthController(
        AppDbContext db,
        IConfiguration config,
        ILogger<GoogleAuthController> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleSignIn([FromBody] GoogleSignInRequest request)
    {
        try
        {
            // Verify the Google ID token
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Authentication:Google:ClientId"] }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, settings);

            // Find or create user
            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == payload.Subject);

            if (user == null)
            {
                user = new User
                {
                    GoogleId = payload.Subject,
                    Email = payload.Email,
                    Name = payload.Name,
                    ProfilePictureUrl = payload.Picture,
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };
                _db.Users.Add(user);
            }
            else
            {
                user.LastLoginAt = DateTime.UtcNow;
                user.Name = payload.Name; // Update name in case it changed
                user.ProfilePictureUrl = payload.Picture;
            }

            await _db.SaveChangesAsync();

            // Generate JWT token
            var jwtToken = GenerateJwtToken(user);

            return Ok(new
            {
                token = jwtToken,
                user = new
                {
                    id = user.Id,
                    email = user.Email,
                    name = user.Name,
                    profilePictureUrl = user.ProfilePictureUrl
                }
            });
        }
        catch (InvalidJwtException ex)
        {
            _logger.LogError(ex, "Invalid Google ID token");
            return Unauthorized(new { error = "Invalid Google token" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google sign-in");
            return StatusCode(500, new { error = "Authentication failed" });
        }
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
            _config["Jwt:SecretKey"] ?? throw new InvalidOperationException("JWT secret key not configured")));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim("google_id", user.GoogleId),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public record GoogleSignInRequest(string IdToken);
