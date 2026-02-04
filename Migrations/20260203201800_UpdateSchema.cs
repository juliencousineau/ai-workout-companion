using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace aiworkoutcompanion.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_DeviceId",
                table: "UserCredentials");

            migrationBuilder.AlterColumn<string>(
                name: "DeviceId",
                table: "UserCredentials",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "UserCredentials",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_DeviceId_Provider",
                table: "UserCredentials",
                columns: new[] { "DeviceId", "Provider" },
                unique: true,
                filter: "\"DeviceId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_UserId_Provider",
                table: "UserCredentials",
                columns: new[] { "UserId", "Provider" },
                unique: true,
                filter: "\"UserId\" IS NOT NULL");

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
            migrationBuilder.DropForeignKey(
                name: "FK_UserCredentials_Users_UserId",
                table: "UserCredentials");

            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_DeviceId_Provider",
                table: "UserCredentials");

            migrationBuilder.DropIndex(
                name: "IX_UserCredentials_UserId_Provider",
                table: "UserCredentials");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "UserCredentials");

            migrationBuilder.AlterColumn<string>(
                name: "DeviceId",
                table: "UserCredentials",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserCredentials_DeviceId",
                table: "UserCredentials",
                column: "DeviceId",
                unique: true);
        }
    }
}
