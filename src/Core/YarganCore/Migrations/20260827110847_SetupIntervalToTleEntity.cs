using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YarganCore.Migrations
{
    /// <inheritdoc />
    public partial class SetupIntervalToTleEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SetupInterval",
                table: "Tle",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsImportent",
                table: "SatellitePasses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SetupInterval",
                table: "Tle");

            migrationBuilder.DropColumn(
                name: "IsImportent",
                table: "SatellitePasses");
        }
    }
}
