using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AiWorkoutCompanion.Data;
using AiWorkoutCompanion.Models;

namespace AiWorkoutCompanion.Controllers;

[Authorize]
[ApiController]
[Route("api/user-settings")]
public class UserSettingsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<UserSettingsController> _logger;

    public UserSettingsController(AppDbContext db, ILogger<UserSettingsController> logger)
    {
        _db = db;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllSettings()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var settings = await _db.UserSettings
            .Where(s => s.UserId == userId.Value)
            .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

        return Ok(new { settings });
    }

    [HttpPost("{key}")]
    public async Task<IActionResult> SaveSetting(string key, [FromBody] SaveSettingRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var setting = await _db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId.Value && s.SettingKey == key);

        if (setting == null)
        {
            setting = new UserSetting
            {
                UserId = userId.Value,
                SettingKey = key,
                SettingValue = request.Value,
                UpdatedAt = DateTime.UtcNow
            };
            _db.UserSettings.Add(setting);
        }
        else
        {
            setting.SettingValue = request.Value;
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpDelete("{key}")]
    public async Task<IActionResult> DeleteSetting(string key)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var setting = await _db.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId.Value && s.SettingKey == key);

        if (setting != null)
        {
            _db.UserSettings.Remove(setting);
            await _db.SaveChangesAsync();
        }

        return Ok(new { success = true });
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public record SaveSettingRequest(string Value);
