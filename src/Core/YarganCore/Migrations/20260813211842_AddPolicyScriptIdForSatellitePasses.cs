using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YarganCore.Migrations
{
    /// <inheritdoc />
    public partial class AddPolicyScriptIdForSatellitePasses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EndAt",
                table: "Tle",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "StartAt",
                table: "Tle",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "PolicyScriptId",
                table: "SatellitePasses",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EndAt",
                table: "Tle");

            migrationBuilder.DropColumn(
                name: "StartAt",
                table: "Tle");

            migrationBuilder.DropColumn(
                name: "PolicyScriptId",
                table: "SatellitePasses");
        }
    }
}
