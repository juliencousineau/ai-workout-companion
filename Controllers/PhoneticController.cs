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
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetPhonetics()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized();

        var mappings = await _db.PhoneticMappings
            .Where(p => p.UserId == userId.Value)
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Canonical)
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
