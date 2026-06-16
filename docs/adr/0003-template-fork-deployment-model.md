# ADR-0003: Template Fork Deployment Model

## Status

Accepted — onboarding guide implemented in [docs/FORK-ONBOARDING.md](../FORK-ONBOARDING.md)

## Context

The framework needs to be distributed across the IT division, where different QA team members will test different web applications. We needed to choose a deployment and repository model that balances ease of maintenance with project isolation.

The primary options considered were:

- **Option A (Shared Monorepo/Submodule):** A single repository containing the framework core, where all projects add their own tests and configurations in subdirectories or as git submodules.
- **Option B (Template Fork):** The core repository acts as a template. Each QA project forks or duplicates the template into its own independent repository.

The decision is to use Option B (Template Fork).

## Decision

Each QA testing project will have its own separate Git repository, created as a fork or copy of the core `playwright-qa-kit` repository. The core repository acts as a template only and does not contain project-specific configs or tests (except for the `example/erpku/` sample implementation).

## Consequences

### Work Required

- **Upstream Synchronization:** Documented in [FORK-ONBOARDING.md](../FORK-ONBOARDING.md) — `git remote add upstream`, fetch/merge workflow, conflict-prone files.
- **Absolute Decoupling:** Any project-specific files (like `.env`, `playwright.config.ts` modifications, custom page objects, requirements, and spec files) must not conflict with core files. We should structure core files to minimize merge conflicts (e.g., using environment variables or external configuration files for overrides).
- **Onboarding Guides:** Implemented — [FORK-ONBOARDING.md](../FORK-ONBOARDING.md) covers clone/fork, remotes, `project.fixture.ts` day-one, environment, verification, optional ERPKU adapter removal.

### Benefits

- **Project Isolation:** Complete separation of tests, test data, requirements, and target URLs. There is zero risk of one project's tests interfering with another's.
- **Customizability:** QA teams can adapt settings, add custom libraries, or customize CI/CD pipelines (e.g., `e2e.yml`) to their project's specific needs without needing permission from a global maintainer.
- **Security:** Project-specific credentials and environment variables are confined to that project's repository and local files, reducing the risk of accidental leaks.

### Risks

- **Upgrade Overhead:** Pushing critical bug fixes or improvements to the MCP servers or agents requires each project repository to pull and merge changes. If project repositories have deviated significantly, this merge could be complex.
- **Divergence:** Over time, project forks may diverge, making it harder to diagnose issues or share custom tools across the division.
