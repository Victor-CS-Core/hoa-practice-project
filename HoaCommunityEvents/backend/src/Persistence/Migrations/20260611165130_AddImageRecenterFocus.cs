using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HoaCommunityEvents.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddImageRecenterFocus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ImagePositionX",
                table: "Events",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "ImagePositionY",
                table: "Events",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "BannerImagePositionX",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "BannerImagePositionY",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.Sql("UPDATE [Events] SET [ImagePositionX] = 50, [ImagePositionY] = 50 WHERE [ImagePositionX] = 0 AND [ImagePositionY] = 0;");
            migrationBuilder.Sql("UPDATE [AspNetUsers] SET [BannerImagePositionX] = 50, [BannerImagePositionY] = 50 WHERE [BannerImagePositionX] = 0 AND [BannerImagePositionY] = 0;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePositionX",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "ImagePositionY",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "BannerImagePositionX",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "BannerImagePositionY",
                table: "AspNetUsers");
        }
    }
}
