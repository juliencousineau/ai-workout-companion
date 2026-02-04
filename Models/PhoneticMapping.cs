namespace AiWorkoutCompanion.Models;

public class PhoneticMapping
{
    public int Id { get; set; }
    public int UserId { get; set; }
    
    /// <summary>
    /// The canonical value (e.g., "6", "next", "done")
    /// </summary>
    public string Canonical { get; set; } = string.Empty;
    
    /// <summary>
    /// The alternative word that maps to the canonical value (e.g., "sex", "necks")
    /// </summary>
    public string Alternative { get; set; } = string.Empty;
    
    /// <summary>
    /// Category: "number" for rep counts, "command" for actions like next/done
    /// </summary>
    public string Category { get; set; } = "number";
    
    public DateTime CreatedAt { get; set; }
    
    // Navigation property
    public User User { get; set; } = null!;
}
