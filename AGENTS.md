# Repository Guidelines

## Project Structure & Module Organization

This checkout currently contains the project overview in `README.md`. The README describes an intended monorepo layout with services under `apps/`, shared libraries under `packages/`, infrastructure configuration under `infrastructure/`, and integration or end-to-end checks under `tests/`. Those directories and the implementation are not present yet. When adding code, follow that component-based layout and update the README to reflect actual files and setup steps.

## Build, Test, and Development Commands

No build, test, or local run commands are defined in the current checkout: there is no package manifest, application entry point, or Compose file. Once implementation begins, add the relevant scripts and document them here and in the README. The README shows `docker compose up --build` as the intended future workflow, not a currently supported command.

## Coding Style & Naming Conventions

No formatter, linter, or language-specific style configuration is present yet. Keep modules focused by product component, use descriptive names, and follow the conventions of the language and tooling introduced with each component. Keep browser SDK code framework-independent and preserve existing customer Service Worker behavior, as called for in the project overview.

## Testing Guidelines

There are no test files or test framework configured yet. Add tests alongside or under `tests/` as the implementation takes shape. Cover subscription lifecycle and notification delivery behavior, including failure and expired-subscription cases. Document the exact test command and any required services when a test runner is added.

## Commit & Pull Request Guidelines

Commit history is unavailable in this checkout, so no repository-specific commit format can be established. Use short, imperative commit subjects (for example, `Add subscription validation`) until the project sets a convention. Pull requests should explain the change and its motivation, link related issues when applicable, include tests or explain why none apply, and add screenshots for dashboard UI changes.

## Security & Configuration

Never commit production credentials, VAPID private keys, or encryption secrets. Use a documented example environment file when configuration is introduced. Validate user-supplied notification content and URLs, protect subscription data, and consider tenant isolation and Service Worker compatibility when changing browser integration behavior.
