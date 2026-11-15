# AGENTS.md — CriptoLab

## 1. Project Context

CriptoLab is an educational web application for exploring classical cryptography and number theory through an interactive 3D cipher machine.

The application uses:

- Rust for cryptographic algorithms and mathematical operations.
- WebAssembly for executing Rust in the browser.
- TypeScript for application logic and interaction.
- Three.js for 3D rendering.
- CSS for interface styling.
- Vite for frontend development.

The project follows Spec-Driven Development (SDD).

## 2. Source of Truth

Before implementing a feature, consult the following documents:

1. `docs/VISION.md` — product goals and scope.
2. `docs/ARCHITECTURE.md` — architectural boundaries.
3. `docs/DECISIONS.md` — accepted technical decisions, when available.
4. `docs/specs/` — feature requirements and acceptance criteria.

A feature specification is the authoritative source for its expected behavior, provided it does not contradict an accepted architectural decision.

If requirements conflict, report the conflict instead of silently choosing an interpretation.

The project documentation is interconnected.
Agents must follow relative Markdown references when consulting related specifications or decisions.

## 3. Development Workflow

All nontrivial features must follow this sequence:

1. Read the relevant specifications.
2. Identify missing requirements or ambiguities.
3. Propose a minimal implementation plan.
4. Define or update acceptance tests.
5. Implement the smallest complete change.
6. Execute the relevant tests.
7. Review architectural compliance.
8. Update documentation when necessary.
9. Summarize changes, verification results and remaining limitations.

Do not implement unspecified features based solely on assumptions.

Small maintenance changes may use a reduced workflow, but must preserve existing behavior.

## 4. Architectural Rules

### Rust

- Keep cryptographic algorithms inside `crypto-core`.
- Keep the domain independent of WebAssembly.
- Prefer pure functions for mathematical operations.
- Use explicit types and structured errors.
- Validate mathematical preconditions.
- Avoid unnecessary dependencies.
- Do not use floating-point arithmetic for exact integer algorithms.

### WebAssembly

- Keep bindings inside `crypto-wasm`.
- Do not duplicate domain logic.
- Define explicit input and output contracts.
- Handle invalid inputs without unexpected crashes.
- Avoid exposing internal implementation details unnecessarily.

### TypeScript

- Use strict TypeScript typing.
- Separate application state from rendering.
- Avoid duplicating cryptographic algorithms.
- Keep view-specific behavior explicit.
- Avoid introducing global mutable state without justification.

### Three.js

- Treat the 3D scene as a representation of application state.
- Do not calculate authoritative cryptographic results inside animations.
- Manage the lifecycle of geometries, materials and other GPU resources.
- Keep camera behavior independent of cryptographic algorithms.
- Prefer reusable scene components over duplicated objects.
- Use GSAP for coordinated 3D animations.
- Keep animation orchestration inside AnimationDirector.
- Animations must support cancellation and cleanup.
- Never modify cryptographic results from animation code.

## 5. Mathematical Correctness

Mathematical correctness takes priority over visual presentation.

Every cryptographic algorithm must specify:

- Input domain.
- Output domain.
- Key constraints.
- Mathematical definition.
- Expected behavior.
- Invalid input handling.
- Test cases.

Educational implementations must explicitly distinguish themselves from production-grade cryptography.

Do not claim that classical ciphers provide modern security.

## 6. Testing Requirements

Rust algorithms must include unit tests.

Where appropriate, include:

- Known test vectors.
- Boundary cases.
- Invalid parameter tests.
- Round-trip properties.
- Mathematical invariants.

Frontend changes must be tested at the appropriate level.

A feature is not complete solely because it appears to work visually.

Do not claim tests passed unless they were executed successfully.

## 7. Scope Control

Do not introduce any of the following without an approved specification or architectural decision:

- New frontend frameworks.
- HTTP servers.
- Databases.
- Authentication systems.
- Multiplayer functionality.
- Unrelated cryptographic algorithms.
- Large 3D asset dependencies.
- Major repository restructuring.

Prefer small, reviewable changes.

Avoid speculative abstractions intended only for hypothetical future requirements.

## 8. Perspective Integrity

CriptoLab contains three educational perspectives:

- Sender.
- Interceptor.
- Internal mechanism.

Each perspective must have a documented information model.

Do not expose private simulation information to the interceptor view through its normal application interfaces.

Do not describe this separation as a security boundary against a user controlling the browser.

## 9. Code Quality

- Prefer clear names over abbreviations.
- Keep functions focused.
- Avoid unnecessary abstraction.
- Handle errors explicitly.
- Document non-obvious mathematical reasoning.
- Keep comments consistent with actual behavior.
- Remove obsolete code instead of retaining unused alternatives.
- Follow existing project conventions.

## 10. Documentation

Update documentation when a change affects:

- Public contracts.
- Mathematical behavior.
- Architectural boundaries.
- User-visible functionality.
- Build or execution instructions.

Document important tradeoffs in `docs/DECISIONS.md`.

Do not rewrite unrelated documentation.

## 11. Definition of Done

A feature is complete when:

- Its specification is satisfied.
- Its acceptance criteria are verified.
- Relevant automated tests pass.
- Mathematical behavior is correct.
- Architectural boundaries are respected.
- Errors and edge cases are handled.
- Documentation is updated where necessary.
- Known limitations are reported.

## 12. Agent Communication

When reporting completed work, provide:

1. Summary of changes.
2. Files modified.
3. Tests executed and results.
4. Architectural decisions introduced.
5. Known limitations or pending work.

Never report unexecuted tests as successful.

If a required tool, dependency or environment is unavailable, explain the limitation rather than fabricating results.

## 13. Guiding Principle

CriptoLab is an educational mathematics project with a 3D interface, not a game engine or production cryptographic system.

Preserve mathematical clarity, modularity and verifiability before adding visual complexity.

## Related Documentation

- [Project Vision](./docs/VISION.md)
- [Software Architecture](./docs/ARCHITECTURE.md)
- [Affine Cipher Specification](./docs/specs/cipher-affine.md)

## 14. Git, Task Size and Pull Requests

- Read this file and the [execution guide](./README.md#preparación-y-ejecución) before running tools. Use `node scripts/dev.mjs` (or the Unix alias `./scripts/dev`); run explicit `setup` before ordinary offline builds. Do not change system Rust, shell profiles or global PATH.
- Inspect `git status` and preserve unrelated changes. Create one branch per assignment from the agreed base: `feat/<topic>`, `fix/<topic>`, `docs/<topic>` or `chore/<topic>`. Never commit directly to `main`. Work already assigned to `feat/first-desktop-demo` stays there until its demo PR is complete.
- Split the assignment into small, coherent tasks. Identify the relevant specification and verifiable acceptance criteria before each implementation. Resolve genuine specification conflicts with the user.
- After each small task, execute its relevant checks, inspect the diff and make a separate commit. Use descriptive messages such as `docs: explain fresh clone setup` or `fix: preserve Windows tool arguments`. Do not bundle unrelated work or commit generated files/secrets.
- Before handoff, run the applicable checks in the README, review architecture and update affected documentation. Record exact commands, actual results and checks that could not run.
- Unless the user explicitly requests local work or forbids pushing, publish the assignment branch and open or update a draft PR targeting the agreed base. Use the [PR template](./.github/pull_request_template.md), link specifications and report actual evidence and limitations. Update an existing assignment PR rather than duplicating it. Never merge automatically.
- Local-only/no-push instructions take precedence: leave verified commits and a reviewable PR description locally, reporting that the PR was not published.
- The [CI workflow](./.github/workflows/ci.yml) validates code; it does not create or merge PRs. Cross-platform support is verified only after the corresponding jobs pass. Screenshots, video and image-bearing traces must remain disabled.

### Documentation routing

Start with [Vision](./docs/VISION.md), [Architecture](./docs/ARCHITECTURE.md) and [Decisions](./docs/DECISIONS.md), then follow the relevant route and its relative links:

| Work area | Required specifications |
| --- | --- |
| Integer mathematics and ciphers | [Math foundations](./docs/specs/math-foundations.md), [Caesar](./docs/specs/cipher-caesar.md), [Affine](./docs/specs/cipher-affine.md) |
| WASM boundary and distribution | [WASM integration](./docs/specs/wasm-integration.md) |
| State, exercise and authorized information | [Learning flow](./docs/specs/learning-flow.md), [Perspectives](./docs/specs/perspectives.md) |
| Introduction, forms and accessibility | [Desktop experience](./docs/specs/desktop-experience.md), [Learning flow](./docs/specs/learning-flow.md) |
| Scene, camera, controls, animation and audio | [Machine interaction](./docs/specs/machine-interaction.md), [Animation system](./docs/specs/animation-system.md) |
| Tooling, onboarding and verification | [README](./README.md), [Decisions](./docs/DECISIONS.md), [Implementation evidence](./docs/IMPLEMENTATION.md) |

Keep unimplemented team observations in the [backlog](./docs/BACKLOG.md). A backlog entry does not replace an approved specification or authorize implementation.
