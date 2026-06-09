---
description: Agent workflow to run the dotnet-react-clean-architecture scaffold skill end-to-end with deterministic defaults, validation, and reporting.
---

# Scaffold Skill Workflow

## Goal

Generate a new full-stack solution using the scaffold skill under skills/dotnet-react-clean-architecture, aligned with TigerTeam stack requirements.

## When to use this workflow

- User asks to scaffold or bootstrap a new project using the TigerTeam stack.
- User asks for Clean Architecture backend plus React/Vite frontend setup.
- User asks for a runnable starter with package dependencies and folder structure pre-created.

## Required constraints

- Runtime target: .NET 10 when available, otherwise .NET 9.
- Architecture: API/Application/Domain/Infrastructure/Persistence.
- Application pattern: services and use-cases.
- Do not use CQRS.
- Do not use MediatR.
- Frontend stack: React + TypeScript + Vite, with feature-based folders.

## Inputs

- AppName (required)
- OutputDir (required)
- UiLibrary (optional): semantic or tailwind
- DotnetFramework (optional): net10.0 preferred, net9.0 fallback

Default behavior:

- DotnetFramework defaults to net10.0.
- UiLibrary defaults to semantic.

## Execution steps

1. Validate workspace prerequisites.
   - Verify commands exist: dotnet, npm, npx.
   - Verify skill script exists: skills/dotnet-react-clean-architecture/scaffold.ps1.

2. Resolve framework target.
   - Run dotnet --list-sdks.
   - If SDK major 10 exists, set DotnetFramework to net10.0.
   - Otherwise set DotnetFramework to net9.0.

3. Build scaffold command.
   - PowerShell command template:
     & "./skills/dotnet-react-clean-architecture/scaffold.ps1" -AppName "<AppName>" -OutputDir "<OutputDir>" -DotnetFramework "<net10.0 or net9.0>" -UiLibrary "<semantic|tailwind>"

4. Run scaffold script and capture output.
   - Run synchronously.
   - Capture stdout and stderr.
   - Fail fast on non-zero exit code.

5. Validate generated outputs.
   - Backend projects exist under output:
     - API
     - Application
     - Domain
     - Infrastructure
     - Persistence
   - Frontend exists under frontend with Vite + TypeScript.
   - Environment templates exist:
     - API/.env.example
     - frontend/.env.example
   - Frontend feature folders exist:
     - src/app
     - src/features
     - src/components
     - src/hooks
     - src/lib
     - src/types

6. Report result.
   - Return command used.
   - Return exit code.
   - Return key created path.
   - Return any environment-specific warnings (for example peer dependency fallback on Semantic UI).

## Error handling policy

- Missing prerequisites:
  - Stop and return which command is missing.
- Scaffold exit code non-zero:
  - Stop and return the exact failing step from command output.
- Semantic UI peer dependency conflict:
  - Accept workflow success when script fallback completes and final exit code is zero.
- Existing target directory:
  - Stop and ask for a new AppName or OutputDir.

## Output contract for agent responses

The agent should always return:

- Executed command line
- Effective framework selected (net10.0 or net9.0)
- Effective UI library
- Scaffold root path
- Exit code
- Validation checklist with pass/fail per item
- Any warnings requiring follow-up

## Example invocation

Input:

- AppName: HoaCommunityEvents
- OutputDir: ./generated
- UiLibrary: semantic

Resulting command:

& "./skills/dotnet-react-clean-architecture/scaffold.ps1" -AppName "HoaCommunityEvents" -OutputDir "./generated" -DotnetFramework "net10.0" -UiLibrary "semantic"
