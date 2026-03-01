# GrXP Audit & Test Improvement Plan

## 1. Understanding Summary
*   **What is being built:** A comprehensive refactoring of the GrXP frontend codebase, alongside a robust automated test suite.
*   **Why it exists:** To address accumulated technical debt and structural issues across State Management, Monolithic Components, Third-party Integrations, and UI Elements, making the application easier and safer to maintain.
*   **Who it is for:** Developers (and AI agents) maintaining and extending the GrXP application in the future.
*   **Key constraints:** Changes must not break existing functionality or lose local data. Performance must remain fluid, especially during complex document exports.
*   **Explicit non-goals:** We are *not* introducing a backend, changing the core feature set, or implementing the previously discussed "Technical Aerospace" design changes during this phase.

## 2. Assumptions
*   **Scale/Architecture:** The application continues to be a client-side only tool relying on local storage.
*   **Performance:** Focuses on UI responsiveness (<100ms) and non-blocking document generation.
*   **Maintenance:** Priority is modularity, self-documentation, and extensive test coverage.

## 3. Decision Log
*   **Focus:** Code Health and Refactoring. (Chosen over purely visual or purely logic testing due to the reversion of previous design changes).
*   **Approach:** "Outside-In" Test-Driven Cleanup. (Writing Playwright E2E tests for safety before refactoring React monolithic components).
*   **Tooling:** Playwright for E2E coverage.
*   **Critical Test Workflows:**
    1.  Dashboard Rendering & Navigation (Mocked Data injection).
    2.  Creating & Editing a Risk (Validating State Management).
    3.  Document Exporting (Triggering downloads without console errors).

## 4. Final Design: "Outside-In" Refactoring Strategy

### Phase 1: Establish the Safety Net (Playwright)
1.  Install and configure Playwright in the GrXP repository.
2.  Create test fixtures to programmatically inject mock `localStorage` data (Catalogs, Risks) to ensure deterministic test runs.
3.  Write E2E tests covering the **Critical Test Workflows** identified in the Decision Log.
4.  Ensure all E2E tests pass reliably in the CI/local environment (`npm run test:e2e`).

### Phase 2: Refactoring Execution (Inside-Out)
*Only proceed with this phase once Phase 1 is complete and tests are green.*
1.  Identify the most complex/monolithic components (e.g., highly nested forms or massive context providers).
2.  Extract pure business logic into isolated custom hooks (e.g., `useRiskScoreCalculator`, `useExportGenerator`). Write fast **Vitest** unit tests for these isolated hooks.
3.  Refactor the monolithic UI components to consume these new, clean hooks.
4.  Run the Playwright E2E suite constantly to verify that structural changes haven't broken the user experience.
