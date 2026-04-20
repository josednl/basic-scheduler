# Basic Scheduler (TS)

A lightweight, type-safe task scheduler built with TypeScript and Node.js.

## Features

- **Type-Safe**: Written entirely in TypeScript with full ESM support.
- **Flexible Timing**: Schedule tasks with specific delays.
- **Repetition**: Support for recurring tasks.
- **Task Management**: Cancel specific tasks or clear all at once.
- **Event-Driven**: Subscribe to scheduler events (`task:scheduled`, `task:executed`, etc.).
- **Interactive CLI**: Manage tasks in real-time through a command-line interface.
- **Test-Driven**: Robust test suite using Vitest.
- **Guaranteed Stability**: Built-in precommit validation for types and tests.

## Installation

```bash
npm install
```

## Quick Start

```typescript
import { Scheduler } from './src/index.js';

const scheduler = new Scheduler();

// Schedule a one-time task
scheduler.schedule({
  id: 'my-task',
  delay: 1000,
  callback: () => console.log('Task executed after 1s')
});

// Schedule a repeating task
scheduler.schedule({
  id: 'heartbeat',
  delay: 2000,
  repeat: true,
  callback: () => console.log('Heartbeat every 2s')
});
```

To see a live demonstration, run:
```bash
npx tsx demo.ts
```

### Interactive CLI

You can also manage tasks interactively:
```bash
npm run cli
```

## Development

### Available Scripts

- `npm run build`: Compiles TypeScript to JavaScript in the `dist/` folder.
- `npm run cli`: Launches the interactive command-line interface.
- `npm run test`: Runs the unit test suite using Vitest.
- `npm run precommit`: Validates the project (build + test). **Mandatory before any commit.**

### Testing
We use `vi.useFakeTimers()` for deterministic time testing.
```bash
npm run test
```

## License
MIT
