# Agent Working Guidelines

This project implements a basic task scheduler in TypeScript. To ensure a consistent and stable codebase, please follow these guidelines.

## Development Setup

1.  **Language**: TypeScript (ESM)
2.  **Runtime**: Node.js (v20+)
3.  **Testing**: [Vitest](https://vitest.dev/)
4.  **Dev Tools**: [tsx](https://tsx.is/) for running TypeScript files directly.

## Roadmap & Architecture

We are building a dual-interface system:
- **Interactive CLI**: For fast, command-line control of tasks using `Inquirer/Enquirer`.
- **Web Dashboard**: A real-time monitoring interface built with `Vite + React` and `Express/WebSockets`.

### Scalability Principles
When adding new features, follow these "Skills":
1.  **Event-Driven**: Use `EventEmitter` to decouple the core scheduler from the interfaces.
2.  **Persistence**: Implement a storage layer (JSON/SQLite) to prevent task loss on restart.
3.  **Error Resilience**: Add retry strategies (Exponential Backoff) for failed tasks.
4.  **Prioritization**: Support task weighting to handle high-load scenarios.

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
