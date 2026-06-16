# ADR-0001: AI-First Selector Discovery Over Mandatory Page Objects

## Status

Accepted

## Context

The Playwright QA Kit is designed for non-programmer QA Users who write markdown requirements and rely on AI agents to generate test code. The framework includes an optional Page Object Model (POM) layer registered per project in `project.fixture.ts` (re-exported via `base.fixture.ts`). The ERPKU reference POMs live in `example/erpku/`.

The question arose: should the Generator agent require pre-built POMs before it can produce tests for a page, or should it auto-discover selectors at generation time?

Requiring POMs would mean every new feature/page needs a Framework Maintainer to build the POM first — creating a bottleneck that blocks QA Users and defeats the goal of AI-assisted autonomy.

## Decision

The Generator agent auto-discovers selectors for unknown pages via `browser_snapshot` without waiting for a Framework Maintainer to pre-build a Page Object. Pre-built POMs are optional optimizations for selector reuse and stability, not prerequisites.

## Consequences

### Benefits

- **QA autonomy** — QA Users can write requirements for any page and get tests immediately, without maintainer involvement.
- **Project portability** — The framework works on any web application out of the box, regardless of how many pages have POMs.
- **Reduced bottleneck** — Maintainers are not in the critical path for test creation.

### Risks

- **Fragile selectors** — AI-discovered selectors may break more easily than curated POM selectors when the application UI changes.
- **No selector reuse** — Without a POM, two tests for the same page may use different selectors for the same element, leading to duplicated maintenance effort.
- **Healer load** — The Healer agent becomes the primary stability mechanism, which increases reliance on AI self-healing quality.

### Mitigations

- The Healer agent repairs broken selectors automatically after UI changes.
- Framework Maintainers can retroactively refactor inline selectors into POMs for high-traffic pages.
- The Generator agent instructions should prefer existing POMs when available, falling back to `browser_snapshot` only for uncovered pages.
