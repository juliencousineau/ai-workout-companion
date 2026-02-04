using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using AiWorkoutCompanion.Models;

namespace AiWorkoutCompanion.Data;

public class AppDbContext : DbContext, IDataProtectionKeyContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<UserSetting> UserSettings { get; set; }
    public DbSet<UserCredential> UserCredentials { get; set; }
    public DbSet<PhoneticMapping> PhoneticMappings { get; set; }
    
    // Data Protection Keys table for persistent key storage
    public DbSet<DataProtectionKey> DataProtectionKeys { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User entity
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.GoogleId).IsUnique();
            entity.Property(e => e.GoogleId).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ProfilePictureUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.LastLoginAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // UserSetting entity
        modelBuilder.Entity<UserSetting>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.SettingKey }).IsUnique();
            entity.Property(e => e.SettingKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.SettingValue).IsRequired();
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne(e => e.User)
                .WithMany(u => u.Settings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserCredential entity - supports both DeviceId (guest) and UserId (authenticated)
        modelBuilder.Entity<UserCredential>(entity =>
        {
            entity.HasKey(e => e.Id);
            
            // Composite unique index for UserId + Provider (authenticated users)
            entity.HasIndex(e => new { e.UserId, e.Provider })
                .IsUnique()
                .HasFilter("\"UserId\" IS NOT NULL");
            
            // Composite unique index for DeviceId + Provider (guest users)
            entity.HasIndex(e => new { e.DeviceId, e.Provider })
                .IsUnique()
                .HasFilter("\"DeviceId\" IS NOT NULL");
            
            entity.Property(e => e.EncryptedApiKey).IsRequired();
            entity.Property(e => e.Provider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            // Foreign key relationship to Users
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // PhoneticMapping entity
        modelBuilder.Entity<PhoneticMapping>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.Alternative }).IsUnique();
            entity.Property(e => e.Canonical).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Alternative).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(20);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

public class UserCredential
{
    public int Id { get; set; }
    public int? UserId { get; set; }  // Nullable - for authenticated users
    public string? DeviceId { get; set; }  // Nullable - for guest users
    public string Provider { get; set; } = "hevy";
    public string EncryptedApiKey { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    
    // Navigation property
    public User? User { get; set; }
}
