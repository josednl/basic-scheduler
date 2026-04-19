import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Scheduler } from '../src/scheduler.js';

describe('Scheduler', () => {
  let scheduler: Scheduler;

  beforeEach(() => {
    scheduler = new Scheduler();
    vi.useFakeTimers();
  });

  afterEach(() => {
    scheduler.cancelAll();
    vi.restoreAllMocks();
  });

  it('should execute a task after the specified delay', async () => {
    const callback = vi.fn();
    scheduler.schedule({
      id: 'task-1',
      callback,
      delay: 1000,
    });

    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1000);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(scheduler.activeTasksCount).toBe(0);
  });

  it('should repeat the task if repeat is true', async () => {
    const callback = vi.fn();
    scheduler.schedule({
      id: 'task-repeat',
      callback,
      delay: 1000,
      repeat: true,
    });

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).toHaveBeenCalledTimes(2);

    expect(scheduler.activeTasksCount).toBe(1);
  });

  it('should cancel a task correctly', async () => {
    const callback = vi.fn();
    scheduler.schedule({
      id: 'task-cancel',
      callback,
      delay: 1000,
    });

    const cancelled = scheduler.cancel('task-cancel');
    expect(cancelled).toBe(true);
    
    await vi.advanceTimersByTimeAsync(1000);
    expect(callback).not.toHaveBeenCalled();
    expect(scheduler.activeTasksCount).toBe(0);
  });

  it('should replace an existing task with the same ID', async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    scheduler.schedule({
      id: 'task-id',
      callback: callback1,
      delay: 1000,
    });

    scheduler.schedule({
      id: 'task-id',
      callback: callback2,
      delay: 500,
    });

    await vi.advanceTimersByTimeAsync(500);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback1).not.toHaveBeenCalled();
    expect(scheduler.activeTasksCount).toBe(0);
  });
});