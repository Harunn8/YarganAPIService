using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YarganCore.Migrations
{
    /// <inheritdoc />
    public partial class AddAlarmModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "EndAt",
                table: "CronPolicies",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<string>(
                name: "CronFormat",
                table: "CronPolicies",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.CreateTable(
                name: "Alarms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    PagDeviceId = table.Column<Guid>(type: "uuid", nullable: false),
                    ParameterId = table.Column<Guid>(type: "uuid", nullable: false),
                    FirstThreshold = table.Column<string>(type: "text", nullable: false),
                    SecondThreshold = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    FirstCondition = table.Column<string>(type: "text", nullable: false),
                    SecondCondition = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    IsAck = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alarms", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CronPolicies_PolicyScriptId",
                table: "CronPolicies",
                column: "PolicyScriptId");

            migrationBuilder.AddForeignKey(
                name: "FK_CronPolicies_Scripts_PolicyScriptId",
                table: "CronPolicies",
                column: "PolicyScriptId",
                principalTable: "Scripts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CronPolicies_Scripts_PolicyScriptId",
                table: "CronPolicies");

            migrationBuilder.DropTable(
                name: "Alarms");

            migrationBuilder.DropIndex(
                name: "IX_CronPolicies_PolicyScriptId",
                table: "CronPolicies");

            migrationBuilder.AlterColumn<DateTime>(
                name: "EndAt",
                table: "CronPolicies",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CronFormat",
                table: "CronPolicies",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
