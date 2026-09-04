namespace HoaCommunityEvents.API.Extensions;

public static class StartupValidationExtensions
{
    public static void ValidateStartupConfiguration(this WebApplication app)
    {
        var logger = app.Services.GetRequiredService<ILoggerFactory>()
            .CreateLogger("StartupValidation");

        var environment = app.Environment.EnvironmentName;
        var enableBootstrapSeed = app.Configuration.GetValue<bool>("Seed:EnableBootstrap");
        var enableDemoSeed = app.Configuration.GetValue<bool>("Seed:EnableDemoData");

        logger.LogInformation(
            "Startup configuration report: Environment={Environment}; SeedBootstrap={SeedBootstrap}; SeedDemoData={SeedDemoData}",
            environment,
            enableBootstrapSeed,
            enableDemoSeed);

        if (app.Environment.IsProduction())
        {
            if (enableBootstrapSeed)
            {
                throw new InvalidOperationException("Seed:EnableBootstrap must be false in Production.");
            }

            if (enableDemoSeed)
            {
                throw new InvalidOperationException("Seed:EnableDemoData must be false in Production.");
            }

            var adminSeedKeys = new[]
            {
                "AdminSeed:Email",
                "AdminSeed:Username",
                "AdminSeed:Password",
                "AdminSeed:DisplayName"
            };

            foreach (var key in adminSeedKeys)
            {
                if (!string.IsNullOrWhiteSpace(app.Configuration[key]))
                {
                    throw new InvalidOperationException(
                        $"{key} must not be configured in Production. Use one-time bootstrap outside Production.");
                }
            }
        }

        if (enableBootstrapSeed)
        {
            EnsureRequiredValue(app.Configuration, "AdminSeed:Email");
            EnsureRequiredValue(app.Configuration, "AdminSeed:Username");
            EnsureRequiredValue(app.Configuration, "AdminSeed:Password");
            EnsureRequiredValue(app.Configuration, "AdminSeed:DisplayName");
        }
    }

    private static void EnsureRequiredValue(IConfiguration configuration, string key)
    {
        if (string.IsNullOrWhiteSpace(configuration[key]))
        {
            throw new InvalidOperationException(
                $"Missing required configuration value '{key}' when Seed:EnableBootstrap is true.");
        }
    }
}
