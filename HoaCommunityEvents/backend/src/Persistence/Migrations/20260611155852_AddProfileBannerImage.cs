using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HoaCommunityEvents.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProfileBannerImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BannerImageUrl",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BannerImageUrl",
                table: "AspNetUsers");
        }
    }
}
