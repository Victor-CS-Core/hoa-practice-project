using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HoaCommunityEvents.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddImageZoomAndAvatarFocus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "ImageZoom",
                table: "Events",
                type: "float",
                nullable: false,
                defaultValue: 1.0);

            migrationBuilder.AddColumn<double>(
                name: "BannerImageZoom",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 1.0);

            migrationBuilder.AddColumn<double>(
                name: "ProfileImagePositionX",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "ProfileImagePositionY",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 50.0);

            migrationBuilder.AddColumn<double>(
                name: "ProfileImageZoom",
                table: "AspNetUsers",
                type: "float",
                nullable: false,
                defaultValue: 1.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageZoom",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "BannerImageZoom",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProfileImagePositionX",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProfileImagePositionY",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ProfileImageZoom",
                table: "AspNetUsers");
        }
    }
}
