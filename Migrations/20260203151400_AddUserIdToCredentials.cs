using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace aiworkoutcompanion.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToCredentials : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Drop existing unique index on DeviceId
            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_DeviceId",
                table: "UserCredentials");

            // Add UserId column (nullable)
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "UserCredentials",
                type: "integer",
                nullable: true);

            // Make DeviceId nullable
            migrationBuilder.AlterColumn<string>(
                name: "DeviceId",
                table: "UserCredentials",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            // Create foreign key to Users table
            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_UserId",
                table: "UserCredentials",
                column: "UserId");

            // Create composite unique index for UserId + Provider (authenticated users only)
            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_UserId_Provider",
                table: "UserCredentials",
                columns: new[] { "UserId", "Provider" },
                unique: true,
                filter: "\"UserId\" IS NOT NULL");

            // Create composite unique index for DeviceId + Provider (guest users only)
            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_DeviceId_Provider",
                table: "UserCredentials",
                columns: new[] { "DeviceId", "Provider" },
                unique: true,
                filter: "\"DeviceId\" IS NOT NULL");

            // Add foreign key constraint
            migrationBuilder.AddForeignKey(
                name: "FK_UserCredentials_Users_UserId",
                table: "UserCredentials",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop foreign key
            migrationBuilder.DropForeignKey(
                name: "FK_UserCredentials_Users_UserId",
                table: "UserCredentials");

            // Drop indexes
            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_UserId",
                table: "UserCredentials");

            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_UserId_Provider",
                table: "UserCredentials");

            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_DeviceId_Provider",
                table: "UserCredentials");

            // Remove UserId column
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "UserCredentials");

            // Restore DeviceId to non-nullable
            migrationBuilder.AlterColumn<string>(
                name: "DeviceId",
                table: "UserCredentials",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            // Recreate original unique index on DeviceId
            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_DeviceId",
                table: "UserCredentials",
                column: "DeviceId",
                unique: true);
        }
    }
}
