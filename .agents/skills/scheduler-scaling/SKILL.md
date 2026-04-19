---
name: scheduler-scaling
description: Expert guidance for scaling a TypeScript task scheduler, focusing on persistence, event-driven architecture, retry strategies, and priority queuing. Use this when implementing advanced features in the basic-scheduler project.
---

# Scheduler Scaling Skill

Guidelines for implementing advanced scheduling features.

## 1. Persistence Layer
When implementing persistence:
- Store tasks in a `tasks.json` or `sqlite` database.
- On startup, the scheduler **must** load and reschedule all pending tasks.
- If a task's delay has already passed, execute it immediately (or mark as missed).

## 2. Event-Driven Architecture
- Extend the `Scheduler` class with `EventEmitter`.
- Emit `task:scheduled`, `task:executed`, `task:failed`, and `task:cancelled` events.
- Interfaces (CLI/Web) must subscribe to these events rather than polling the scheduler's state.

## 3. Retry & Backoff Strategies
- Failed tasks should not be discarded immediately.
- Implement an `attempts` property in the `Task` interface.
- Use **Exponential Backoff** (e.g., $delay * 2^{attempt}$) to reschedule failed tasks.

## 4. Priority Queueing
- Add a `priority` field (1-10) to the `Task` interface.
- Tasks with higher priority should be processed first if multiple tasks are due at the same time.
- Use a Min-Heap or similar structure for efficient task management when scaling to thousands of tasks.
