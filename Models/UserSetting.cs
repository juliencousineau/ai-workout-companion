namespace AiWorkoutCompanion.Models;

public class UserSetting
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string SettingKey { get; set; } = string.Empty;
    public string SettingValue { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    
    // Navigation property
    public User User { get; set; } = null!;
}
