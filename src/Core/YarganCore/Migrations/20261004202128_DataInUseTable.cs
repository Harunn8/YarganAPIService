using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YarganCore.Migrations
{
    /// <inheritdoc />
    public partial class DataInUseTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DataInUses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DataId = table.Column<Guid>(type: "uuid", nullable: false),
                    DataType = table.Column<string>(type: "text", nullable: false),
                    EntityName = table.Column<string>(type: "text", nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    DevicesId = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdateDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DataInUses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DataInUses_Devices_DevicesId",
                        column: x => x.DevicesId,
                        principalTable: "Devices",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_DataInUses_DevicesId",
                table: "DataInUses",
                column: "DevicesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DataInUses");
        }
    }
}
