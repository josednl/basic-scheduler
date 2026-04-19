# Agent Working Guidelines

This project implements a basic task scheduler in TypeScript. To ensure a consistent and stable codebase, please follow these guidelines.

## Development Setup

1.  **Language**: TypeScript (ESM)
2.  **Runtime**: Node.js (v20+)
3.  **Testing**: [Vitest](https://vitest.dev/)
4.  **Dev Tools**: [tsx](https://tsx.is/) for running TypeScript files directly.

## Mandatory Workflow

### Pre-commit Validation
Before making any commit, you **must** run the following command to ensure the code compiles and all tests pass:

```powershell
npm run precommit
```

This script executes:
1.  `tsc`: Verifies TypeScript types.
2.  `vitest run`: Executes the test suite.

**Never push or commit code if this command fails.**

## Commits
We follow [Conventional Commits](https://www.conventionalcommits.org/). Common types:
- `feat`: New features.
- `fix`: Bug fixes.
- `test`: Adding or updating tests.
- `docs`: Documentation changes.
- `chore`: Maintenance tasks (dependencies, config, etc.).

## Testing Strategy
All new logic must be accompanied by unit tests in the `test/` directory. Use `vi.useFakeTimers()` for testing time-sensitive operations and `vi.advanceTimersByTimeAsync()` to handle asynchronous tasks within the scheduler.
