using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using AiWorkoutCompanion.Data;
using System.Security.Claims;

namespace AiWorkoutCompanion.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CredentialsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IDataProtector _protector;
    private readonly ILogger<CredentialsController> _logger;

    public CredentialsController(
        AppDbContext db,
        IDataProtectionProvider protectionProvider,
        ILogger<CredentialsController> logger)
    {
        _db = db;
        _protector = protectionProvider.CreateProtector("UserCredentials");
        _logger = logger;
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveCredentials([FromBody] SaveCredentialsRequest request)
    {
        try
        {
            // Encrypt API key
            var encryptedKey = _protector.Protect(request.ApiKey);

            // Get UserId from JWT if authenticated
            int? userId = GetUserIdFromClaims();

            UserCredential? credential = null;

            // Priority 1: Try to find/update existing credential by UserId (authenticated)
            if (userId.HasValue)
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == request.Provider);

                if (credential == null)
                {
                    // Create new credential for authenticated user
                    credential = new UserCredential
                    {
                        UserId = userId,
                        DeviceId = null, // Don't use DeviceId for authenticated users
                        Provider = request.Provider,
                        EncryptedApiKey = encryptedKey,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.UserCredentials.Add(credential);
                    _logger.LogInformation("Creating new credential for authenticated user {UserId}", userId);
                }
                else
                {
                    // Update existing
                    credential.EncryptedApiKey = encryptedKey;
                    credential.LastUsedAt = DateTime.UtcNow;
                    _logger.LogInformation("Updating credential for authenticated user {UserId}", userId);
                }
            }
            // Priority 2: Fall back to DeviceId for guest users
            else if (!string.IsNullOrEmpty(request.DeviceId))
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);

                if (credential == null)
                {
                    // Create new credential for guest user
                    credential = new UserCredential
                    {
                        UserId = null,
                        DeviceId = request.DeviceId,
                        Provider = request.Provider,
                        EncryptedApiKey = encryptedKey,
                        CreatedAt = DateTime.UtcNow
                    };
                    _db.UserCredentials.Add(credential);
                    _logger.LogInformation("Creating new credential for guest device {DeviceId}", request.DeviceId);
                }
                else
                {
                    // Update existing
                    credential.EncryptedApiKey = encryptedKey;
                    credential.LastUsedAt = DateTime.UtcNow;
                    _logger.LogInformation("Updating credential for guest device {DeviceId}", request.DeviceId);
                }
            }
            else
            {
                return BadRequest(new { error = "Either user authentication or device ID is required" });
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true, userLinked = userId.HasValue });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save credentials");
            return StatusCode(500, new { error = "Failed to save credentials" });
        }
    }

    [HttpPost("load")]
    public async Task<IActionResult> LoadCredentials([FromBody] LoadCredentialsRequest request)
    {
        try
        {
            // Get UserId from JWT if authenticated
            int? userId = GetUserIdFromClaims();

            UserCredential? credential = null;

            // Priority 1: Try to load by UserId (authenticated)
            if (userId.HasValue)
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == request.Provider);
                
                if (credential != null)
                {
                    _logger.LogInformation("Loaded credential for authenticated user {UserId}", userId);
                }
            }

            // Priority 2: Fall back to DeviceId for guest users
            if (credential == null && !string.IsNullOrEmpty(request.DeviceId))
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);
                
                if (credential != null)
                {
                    _logger.LogInformation("Loaded credential for guest device {DeviceId}", request.DeviceId);
                }
            }

            if (credential == null)
            {
                return Ok(new { found = false });
            }

            // Decrypt API key
            var apiKey = _protector.Unprotect(credential.EncryptedApiKey);

            // Update last used
            credential.LastUsedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new
            {
                found = true,
                apiKey = apiKey,
                userLinked = credential.UserId.HasValue
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load credentials");
            return StatusCode(500, new { error = "Failed to load credentials" });
        }
    }

    [HttpPost("delete")]
    public async Task<IActionResult> DeleteCredentials([FromBody] LoadCredentialsRequest request)
    {
        try
        {
            // Get UserId from JWT if authenticated
            int? userId = GetUserIdFromClaims();

            UserCredential? credential = null;

            // Priority 1: Try to delete by UserId (authenticated)
            if (userId.HasValue)
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.UserId == userId && c.Provider == request.Provider);
            }

            // Priority 2: Fall back to DeviceId for guest users
            if (credential == null && !string.IsNullOrEmpty(request.DeviceId))
            {
                credential = await _db.UserCredentials
                    .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);
            }

            if (credential != null)
            {
                _db.UserCredentials.Remove(credential);
                await _db.SaveChangesAsync();
                _logger.LogInformation("Deleted credential for {Type}: {Id}", 
                    credential.UserId.HasValue ? "user" : "device",
                    credential.UserId?.ToString() ?? credential.DeviceId);
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete credentials");
            return StatusCode(500, new { error = "Failed to delete credentials" });
        }
    }

    /// <summary>
    /// Helper method to extract UserId from JWT claims
    /// </summary>
    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out int userId))
        {
            return userId;
        }
        return null;
    }
}

public record SaveCredentialsRequest(string? DeviceId, string Provider, string ApiKey);
public record LoadCredentialsRequest(string? DeviceId, string Provider);
