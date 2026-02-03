namespace AiWorkoutCompanion.Models;

public class User
{
    public int Id { get; set; }
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime LastLoginAt { get; set; }
    
    // Navigation properties
    public ICollection<UserSetting> Settings { get; set; } = new List<UserSetting>();
}
