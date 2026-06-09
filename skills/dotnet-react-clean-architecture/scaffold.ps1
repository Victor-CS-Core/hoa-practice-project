param (
    [Parameter(Mandatory = $true)]
    [ValidatePattern("^[A-Za-z][A-Za-z0-9._-]*$")]
    [string]$AppName,

    [string]$OutputDir = ".",

    [ValidateSet("net8.0", "net9.0", "net10.0")]
    [string]$DotnetFramework = "net8.0",

    [ValidateSet("semantic", "tailwind")]
    [string]$UiLibrary = "semantic"
)

$ErrorActionPreference = "Stop"

function Test-RequiredCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        $message = "Required command '$Name' was not found."
        if ($InstallHint) {
            $message = "$message $InstallHint"
        }

        throw $message
    }
}

function New-DirectoryIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path | Out-Null
    }
}

function New-Utf8File {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path,
        [Parameter(Mandatory = $true)]
        [string]$Content
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

function Invoke-NativeCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,
        [Parameter(Mandatory = $true)]
        [string]$FailureMessage
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FailureMessage (exit code $LASTEXITCODE)."
    }
}

function Add-DotnetPackageIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ProjectPath,
        [Parameter(Mandatory = $true)]
        [string]$PackageName,
        [string]$Version
    )

    [xml]$projectXml = Get-Content -Path $ProjectPath
    $packageRefs = @($projectXml.Project.ItemGroup.PackageReference)
    $exists = $false

    foreach ($ref in $packageRefs) {
        if ($ref.Include -eq $PackageName) {
            $exists = $true
            break
        }
    }

    if ($exists) {
        Write-Host "Package already present in ${ProjectPath}: $PackageName"
        return
    }

    Write-Host "Installing package in ${ProjectPath}: $PackageName"
    if ([string]::IsNullOrWhiteSpace($Version)) {
        Invoke-NativeCommand -Command "dotnet" -Arguments @("add", $ProjectPath, "package", $PackageName) -FailureMessage "Failed to install package '$PackageName' in '$ProjectPath'"
    }
    else {
        Invoke-NativeCommand -Command "dotnet" -Arguments @("add", $ProjectPath, "package", $PackageName, "--version", $Version) -FailureMessage "Failed to install package '$PackageName' ($Version) in '$ProjectPath'"
    }
}

function Get-NpmPackageMap {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PackageJsonPath
    )

    $pkg = Get-Content -Path $PackageJsonPath -Raw | ConvertFrom-Json
    $map = @{}

    if ($null -ne $pkg.dependencies) {
        foreach ($item in $pkg.dependencies.PSObject.Properties) {
            $map[$item.Name] = "dependency"
        }
    }

    if ($null -ne $pkg.devDependencies) {
        foreach ($item in $pkg.devDependencies.PSObject.Properties) {
            $map[$item.Name] = "devDependency"
        }
    }

    return $map
}

function Add-NpmPackagesIfMissing {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Packages,
        [switch]$Dev
    )

    $packageJsonPath = "package.json"
    $packageMap = Get-NpmPackageMap -PackageJsonPath $packageJsonPath
    $missing = @()

    foreach ($package in $Packages) {
        if (-not $packageMap.ContainsKey($package)) {
            $missing += $package
        }
    }

    if ($missing.Count -eq 0) {
        Write-Host "All requested npm packages already present."
        return
    }

    if ($Dev) {
        Write-Host "Installing missing npm devDependencies: $($missing -join ', ')"
        Invoke-NativeCommand -Command "npm" -Arguments (@("install", "-D") + $missing) -FailureMessage "Failed installing npm devDependencies"
    }
    else {
        Write-Host "Installing missing npm dependencies: $($missing -join ', ')"
        Invoke-NativeCommand -Command "npm" -Arguments (@("install") + $missing) -FailureMessage "Failed installing npm dependencies"
    }
}

function Install-SemanticUiPackages {
    Write-Host "Installing Semantic UI packages"
    $reactMajor = 0
    $pkg = Get-Content -Path "package.json" -Raw | ConvertFrom-Json
    $reactVersion = $null

    if ($null -ne $pkg.dependencies -and $null -ne $pkg.dependencies.react) {
        $reactVersion = [string]$pkg.dependencies.react
    }
    elseif ($null -ne $pkg.devDependencies -and $null -ne $pkg.devDependencies.react) {
        $reactVersion = [string]$pkg.devDependencies.react
    }

    if (-not [string]::IsNullOrWhiteSpace($reactVersion) -and $reactVersion -match '(\d+)') {
        $reactMajor = [int]$matches[1]
    }

    if ($reactMajor -ge 19) {
        Write-Host "Detected React $reactMajor; installing Semantic UI with --legacy-peer-deps for compatibility"
        & npm install semantic-ui-react semantic-ui-css --legacy-peer-deps
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to install Semantic UI packages with --legacy-peer-deps (exit code $LASTEXITCODE)."
        }
        return
    }

    & npm install semantic-ui-react semantic-ui-css
    if ($LASTEXITCODE -eq 0) {
        return
    }

    Write-Host "Semantic UI install had peer dependency conflicts; retrying with --legacy-peer-deps"
    & npm install semantic-ui-react semantic-ui-css --legacy-peer-deps
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Semantic UI packages after retry with --legacy-peer-deps (exit code $LASTEXITCODE)."
    }
}

Test-RequiredCommand -Name "dotnet" -InstallHint "Install .NET SDK 8+ and try again."
Test-RequiredCommand -Name "npm" -InstallHint "Install Node.js LTS and try again."
Test-RequiredCommand -Name "npx" -InstallHint "Install Node.js LTS and try again."

$sdkOutput = dotnet --list-sdks
$targetMajor = [int](($DotnetFramework -split '[.]')[0] -replace 'net', '')
$hasCompatibleSdk = $false

foreach ($sdk in $sdkOutput) {
    if ($sdk -match '^(\d+)\.') {
        $sdkMajor = [int]$matches[1]
        if ($sdkMajor -ge $targetMajor) {
            $hasCompatibleSdk = $true
            break
        }
    }
}

if (-not $hasCompatibleSdk) {
    throw "No compatible .NET SDK found for target $DotnetFramework. Install .NET SDK $targetMajor or newer."
}

New-DirectoryIfMissing -Path $OutputDir
$workspaceRoot = Resolve-Path $OutputDir
$solutionRoot = Join-Path $workspaceRoot $AppName

if (Test-Path $solutionRoot) {
    throw "Target directory already exists: $solutionRoot"
}

New-Item -ItemType Directory -Path $solutionRoot | Out-Null
Set-Location $solutionRoot

$apiProjectPath = Join-Path $solutionRoot "API/$AppName.API.csproj"
$applicationProjectPath = Join-Path $solutionRoot "Application/$AppName.Application.csproj"
$domainProjectPath = Join-Path $solutionRoot "Domain/$AppName.Domain.csproj"
$infrastructureProjectPath = Join-Path $solutionRoot "Infrastructure/$AppName.Infrastructure.csproj"
$persistenceProjectPath = Join-Path $solutionRoot "Persistence/$AppName.Persistence.csproj"

Write-Host "Creating solution: $AppName"
dotnet new sln -n $AppName

Write-Host "Creating Clean Architecture backend layers"
dotnet new webapi -n "$AppName.API" -o API -f $DotnetFramework
dotnet new classlib -n "$AppName.Application" -o Application -f $DotnetFramework
dotnet new classlib -n "$AppName.Domain" -o Domain -f $DotnetFramework
dotnet new classlib -n "$AppName.Infrastructure" -o Infrastructure -f $DotnetFramework
dotnet new classlib -n "$AppName.Persistence" -o Persistence -f $DotnetFramework

Write-Host "Adding backend projects to solution"
dotnet sln add $apiProjectPath
dotnet sln add $applicationProjectPath
dotnet sln add $domainProjectPath
dotnet sln add $infrastructureProjectPath
dotnet sln add $persistenceProjectPath

Write-Host "Wiring Clean Architecture project references"
dotnet add $apiProjectPath reference $applicationProjectPath $infrastructureProjectPath
dotnet add $applicationProjectPath reference $domainProjectPath
dotnet add $infrastructureProjectPath reference $applicationProjectPath $persistenceProjectPath
dotnet add $persistenceProjectPath reference $domainProjectPath

Write-Host "Installing required backend packages"
# API
Add-DotnetPackageIfMissing -ProjectPath $apiProjectPath -PackageName "Swashbuckle.AspNetCore"
Add-DotnetPackageIfMissing -ProjectPath $apiProjectPath -PackageName "Microsoft.AspNetCore.Authentication.JwtBearer"
Add-DotnetPackageIfMissing -ProjectPath $apiProjectPath -PackageName "FluentValidation.AspNetCore"

# Application
Add-DotnetPackageIfMissing -ProjectPath $applicationProjectPath -PackageName "AutoMapper"
Add-DotnetPackageIfMissing -ProjectPath $applicationProjectPath -PackageName "FluentValidation"

# Persistence
Add-DotnetPackageIfMissing -ProjectPath $persistenceProjectPath -PackageName "Microsoft.EntityFrameworkCore.SqlServer"
Add-DotnetPackageIfMissing -ProjectPath $persistenceProjectPath -PackageName "Microsoft.AspNetCore.Identity.EntityFrameworkCore"
Add-DotnetPackageIfMissing -ProjectPath $persistenceProjectPath -PackageName "Microsoft.EntityFrameworkCore.Design"
Add-DotnetPackageIfMissing -ProjectPath $persistenceProjectPath -PackageName "Microsoft.EntityFrameworkCore.Tools"

# Infrastructure
Add-DotnetPackageIfMissing -ProjectPath $infrastructureProjectPath -PackageName "Microsoft.AspNetCore.SignalR.Client"
Add-DotnetPackageIfMissing -ProjectPath $infrastructureProjectPath -PackageName "System.IdentityModel.Tokens.Jwt"

Write-Host "Creating backend starter folders"
$backendFolders = @(
    "API/Controllers",
    "API/Middleware",
    "API/Hubs",
    "API/Extensions",
    "Application/Common/Interfaces",
    "Application/Common/Models",
    "Application/Services",
    "Application/UseCases",
    "Application/DTOs",
    "Domain/Entities",
    "Domain/Common",
    "Infrastructure/Services/Media",
    "Infrastructure/Services/Identity",
    "Persistence/Data",
    "Persistence/Migrations"
)

foreach ($folder in $backendFolders) {
    New-DirectoryIfMissing -Path (Join-Path $solutionRoot $folder)
}

Write-Host "Creating backend environment templates"
New-Utf8File -Path (Join-Path $solutionRoot "API/appsettings.Development.json") -Content @"
{
    "ConnectionStrings": {
        "DefaultConnection": "Server=localhost,1433;Database=$AppName;User Id=sa;Password=Your_password123;TrustServerCertificate=True"
    },
    "TokenKey": "ReplaceWithLongSecureTokenKeyAtLeast64Chars",
    "AllowedHosts": "*"
}
"@

New-Utf8File -Path (Join-Path $solutionRoot "API/.env.example") -Content @"
ConnectionStrings__DefaultConnection=
TokenKey=
ASPNETCORE_ENVIRONMENT=Development
"@

Write-Host "Scaffolding frontend (React + TypeScript + Vite)"
"n" | npx -y create-vite@latest frontend --template react-ts
if ($LASTEXITCODE -ne 0) {
    throw "Failed to scaffold Vite frontend (exit code $LASTEXITCODE)."
}

Set-Location frontend

$frontendRoot = Join-Path $solutionRoot "frontend"

Write-Host "Installing frontend dependencies"
Invoke-NativeCommand -Command "npm" -Arguments @("install") -FailureMessage "Failed running npm install for frontend"
Add-NpmPackagesIfMissing -Packages @("axios", "react-router-dom", "mobx", "mobx-react-lite", "@tanstack/react-query", "react-hook-form", "@microsoft/signalr")

if ($UiLibrary -eq "semantic") {
    Install-SemanticUiPackages
}
else {
    Add-NpmPackagesIfMissing -Packages @("tailwindcss", "@tailwindcss/vite") -Dev
}

Write-Host "Creating frontend feature-based structure"
$frontendFolders = @(
    "src/app",
    "src/app/api",
    "src/app/router",
    "src/app/layout",
    "src/app/stores",
    "src/features",
    "src/components",
    "src/hooks",
    "src/lib",
    "src/types"
)

foreach ($folder in $frontendFolders) {
    New-DirectoryIfMissing -Path (Join-Path $frontendRoot $folder)
}

New-Utf8File -Path (Join-Path $frontendRoot ".env.example") -Content "VITE_API_URL=http://localhost:5000/api"

New-Utf8File -Path (Join-Path $frontendRoot "src/app/api/agent.ts") -Content @'
import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

export const agent = axios.create({
    baseURL,
    withCredentials: false,
});

agent.interceptors.request.use((config) => {
    const token = localStorage.getItem('jwt');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

agent.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            console.error('Unauthorized request');
        }
        return Promise.reject(error);
    }
);
'@

New-Utf8File -Path (Join-Path $frontendRoot "src/app/stores/store.ts") -Content @'
import { configure } from 'mobx';

configure({ enforceActions: 'never' });

export const store = {};
'@

New-Utf8File -Path (Join-Path $frontendRoot "src/app/router/routes.tsx") -Content @'
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <div>App Shell</div>,
    },
]);
'@

Set-Location ..

New-Utf8File -Path (Join-Path $solutionRoot "README.md") -Content @"
# $AppName

Scaffolded with dotnet-react-clean-architecture skill.

## Stack

- Backend: ASP.NET Core Web API ($DotnetFramework), Clean Architecture, service/use-case application layer, EF Core SQL Server, Identity, JWT, AutoMapper, FluentValidation, SignalR, Swagger
- Frontend: React + TypeScript + Vite, React Router, Axios, TanStack Query, MobX, React Hook Form

## Next steps

1. Configure backend variables in API/.env.example and appsettings.Development.json.
2. Run EF Core migrations from the Persistence project.
3. Build auth endpoints (register/login/logout/current user) and protected routes.
4. Add CRUD features with paging/sorting/filtering.
"@

Write-Host "Scaffolding complete for $AppName at $solutionRoot"
