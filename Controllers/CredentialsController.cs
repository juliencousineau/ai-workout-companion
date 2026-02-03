using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using AiWorkoutCompanion.Data;

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

            // Find or create credential entry
            var credential = await _db.UserCredentials
                .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);

            if (credential == null)
            {
                credential = new UserCredential
                {
                    DeviceId = request.DeviceId,
                    Provider = request.Provider,
                    EncryptedApiKey = encryptedKey,
                    CreatedAt = DateTime.UtcNow
                };
                _db.UserCredentials.Add(credential);
            }
            else
            {
                credential.EncryptedApiKey = encryptedKey;
                credential.LastUsedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true });
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
            var credential = await _db.UserCredentials
                .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);

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
                apiKey = apiKey
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
            var credential = await _db.UserCredentials
                .FirstOrDefaultAsync(c => c.DeviceId == request.DeviceId && c.Provider == request.Provider);

            if (credential != null)
            {
                _db.UserCredentials.Remove(credential);
                await _db.SaveChangesAsync();
            }

            return Ok(new { success = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete credentials");
            return StatusCode(500, new { error = "Failed to delete credentials" });
        }
    }
}

public record SaveCredentialsRequest(string DeviceId, string Provider, string ApiKey);
public record LoadCredentialsRequest(string DeviceId, string Provider);
