using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using AiWorkoutCompanion.Data;
using AiWorkoutCompanion.Models;

namespace AiWorkoutCompanion.Controllers;

[Authorize]
[ApiController]
[Route("api/phonetics")]
public class PhoneticController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<PhoneticController> _logger;

    public PhoneticController(AppDbContext db, ILogger<PhoneticController> logger)
    {
        _db = db;
        _logger = logger;
    }

    /// <summary>
    /// Get all phonetic mappings for the current user
    /// Seeds default phonetics if user has none
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPhonetics()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        // Check if user has any phonetics
        var hasPhonetics = await _db.PhoneticMappings.AnyAsync(p => p.UserId == userId.Value);
        
        // Seed defaults if user has none
        if (!hasPhonetics)
        {
            await SeedDefaultPhonetics(userId.Value);
        }

        var mappings = await _db.PhoneticMappings
            .Where(p => p.UserId == userId.Value)
            .OrderBy(p => p.Canonical)
            .ThenBy(p => p.Alternative)
            .Select(p => new
            {
                p.Id,
                p.Canonical,
                p.Alternative,
                p.Category,
                p.CreatedAt
            })
            .ToListAsync();

        return Ok(new { phonetics = mappings });
    }

    /// <summary>
    /// Seed default phonetic mappings for a new user
    /// </summary>
    private async Task SeedDefaultPhonetics(int userId)
    {
        var defaults = new Dictionary<string, List<string>>
        {
            { "0", new List<string> { "zero", "oh" } },
            { "1", new List<string> { "one", "won", "wan" } },
            { "2", new List<string> { "two", "to", "too", "tu" } },
            { "3", new List<string> { "three", "tree", "free", "thee" } },
            { "4", new List<string> { "four", "for", "fore", "floor" } },
            { "5", new List<string> { "five", "fife", "hive" } },
            { "6", new List<string> { "six", "sicks" } },
            { "7", new List<string> { "seven", "sven" } },
            { "8", new List<string> { "eight", "ate", "ait" } },
            { "9", new List<string> { "nine", "nein", "mine" } },
            { "10", new List<string> { "ten", "tin" } },
            { "11", new List<string> { "eleven", "leaven" } },
            { "12", new List<string> { "twelve", "twelfth" } },
            { "13", new List<string> { "thirteen" } },
            { "14", new List<string> { "fourteen" } },
            { "15", new List<string> { "fifteen" } },
            { "16", new List<string> { "sixteen" } },
            { "17", new List<string> { "seventeen" } },
            { "18", new List<string> { "eighteen" } },
            { "19", new List<string> { "nineteen" } },
            { "20", new List<string> { "twenty" } }
        };

        foreach (var (canonical, alternatives) in defaults)
        {
            foreach (var alt in alternatives)
            {
                _db.PhoneticMappings.Add(new PhoneticMapping
                {
                    UserId = userId,
                    Canonical = canonical,
                    Alternative = alt,
                    Category = "number",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        await _db.SaveChangesAsync();
        _logger.LogInformation("Seeded default phonetics for user {UserId}", userId);
    }

    /// <summary>
    /// Add a new phonetic mapping
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> AddPhonetic([FromBody] AddPhoneticRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        // Normalize inputs
        var alternative = request.Alternative.ToLowerInvariant().Trim();
        var canonical = request.Canonical.ToLowerInvariant().Trim();
        var category = request.Category?.ToLowerInvariant().Trim() ?? "number";

        // Check if this alternative already exists for this user
        var existing = await _db.PhoneticMappings
            .FirstOrDefaultAsync(p => p.UserId == userId.Value && p.Alternative == alternative);

        if (existing != null)
        {
            // Update existing mapping
            existing.Canonical = canonical;
            existing.Category = category;
            _logger.LogInformation("Updated phonetic mapping: {Alternative} -> {Canonical} for user {UserId}",
                alternative, canonical, userId);
        }
        else
        {
            // Create new mapping
            var mapping = new PhoneticMapping
            {
                UserId = userId.Value,
                Canonical = canonical,
                Alternative = alternative,
                Category = category,
                CreatedAt = DateTime.UtcNow
            };
            _db.PhoneticMappings.Add(mapping);
            _logger.LogInformation("Added phonetic mapping: {Alternative} -> {Canonical} for user {UserId}",
                alternative, canonical, userId);
        }

        await _db.SaveChangesAsync();
        return Ok(new { success = true });
    }

    /// <summary>
    /// Delete a phonetic mapping
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePhonetic(int id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var mapping = await _db.PhoneticMappings
            .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId.Value);

        if (mapping == null)
            return NotFound();

        _db.PhoneticMappings.Remove(mapping);
        await _db.SaveChangesAsync();

        _logger.LogInformation("Deleted phonetic mapping {Id} for user {UserId}", id, userId);
        return Ok(new { success = true });
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public record AddPhoneticRequest(string Canonical, string Alternative, string? Category);
