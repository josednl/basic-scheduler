import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';

export type TaskCallback = () => void | Promise<void>;

/**
 * Represents a task to be executed by the scheduler.
 */
export interface Task {
  id: string;
  callback?: TaskCallback;
  delay: number;
  repeat?: boolean;
  metadata?: any;
  scheduledAt?: number;
}

/**
 * Core task scheduler with persistence and event-driven updates.
 */
export class Scheduler extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private storagePath: string;

  constructor(storagePath?: string) {
    super();
    this.storagePath = storagePath || path.join(process.cwd(), 'tasks.json');
  }

  /**
   * Loads tasks from the local storage file and reschedules them.
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      const savedTasks: Task[] = JSON.parse(data);
      
      const now = Date.now();
      for (const task of savedTasks) {
        // Calculate remaining delay
        const elapsed = now - (task.scheduledAt || now);
        const remainingDelay = Math.max(0, task.delay - elapsed);
        
        // Use a default callback if none was provided during load
        if (!task.callback && task.metadata?.message) {
          task.callback = () => {
            console.log(`[PERSISTED TASK ${task.id}] ${task.metadata.message}`);
          };
        }

        this.schedule({
          ...task,
          delay: remainingDelay
        });
      }
      console.log(`Loaded ${savedTasks.length} tasks from persistence.`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading tasks:', error);
      }
    }
  }

  /**
   * Persists active tasks to the local storage file.
   */
  async save(): Promise<void> {
    try {
      const tasksToSave = Array.from(this.tasks.values()).map(t => ({
        id: t.id,
        delay: t.delay,
        repeat: t.repeat,
        metadata: t.metadata,
        scheduledAt: t.scheduledAt
      }));
      await fs.writeFile(this.storagePath, JSON.stringify(tasksToSave, null, 2));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  }

  /**
   * Schedules a task to be executed after the specified delay.
   */
  schedule(task: Task): void {
    if (this.tasks.has(task.id)) {
      this.cancel(task.id);
    }

    if (!task.scheduledAt) {
      task.scheduledAt = Date.now();
    }

    this.tasks.set(task.id, task);
    this.save(); // Async save

    const execute = async () => {
      try {
        if (task.callback) {
          await task.callback();
        }
        this.emit('task:executed', task.id);
      } catch (error) {
        this.emit('task:failed', task.id, error);
        console.error(`Error executing task ${task.id}:`, error);
      } finally {
        if (task.repeat) {
          // If the task was cancelled while executing, don't reschedule
          if (this.tasks.has(task.id)) {
            const timeout = setTimeout(execute, task.delay);
            this.timeouts.set(task.id, timeout);
          }
        } else {
          this.tasks.delete(task.id);
          this.timeouts.delete(task.id);
          this.save();
        }
      }
    };

    const timeout = setTimeout(execute, task.delay);
    this.timeouts.set(task.id, timeout);
    this.emit('task:scheduled', task);
  }

  /**
   * Cancels a scheduled task by its ID.
   */
  cancel(taskId: string): boolean {
    const timeout = this.timeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(taskId);
      this.tasks.delete(taskId);
      this.save();
      this.emit('task:cancelled', taskId);
      return true;
    }
    return false;
  }

  /**
   * Cancels all active tasks and clears persistence.
   */
  cancelAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    const taskIds = Array.from(this.tasks.keys());
    this.tasks.clear();
    this.save();
    taskIds.forEach(id => this.emit('task:cancelled', id));
  }

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  get activeTasksCount(): number {
    return this.tasks.size;
  }
}
