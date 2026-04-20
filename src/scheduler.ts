import { EventEmitter } from 'node:events';

export type TaskCallback = () => void | Promise<void>;

export interface Task {
  id: string;
  callback: TaskCallback;
  delay: number;
  repeat?: boolean;
}

export class Scheduler extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  schedule(task: Task): void {
    if (this.tasks.has(task.id)) {
      this.cancel(task.id);
    }

    this.tasks.set(task.id, task);

    const execute = async () => {
      try {
        await task.callback();
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
        }
      }
    };

    const timeout = setTimeout(execute, task.delay);
    this.timeouts.set(task.id, timeout);
    this.emit('task:scheduled', task);
  }

  cancel(taskId: string): boolean {
    const timeout = this.timeouts.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(taskId);
      this.tasks.delete(taskId);
      this.emit('task:cancelled', taskId);
      return true;
    }
    return false;
  }

  cancelAll(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();
    const taskIds = Array.from(this.tasks.keys());
    this.tasks.clear();
    taskIds.forEach(id => this.emit('task:cancelled', id));
  }

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  get activeTasksCount(): number {
    return this.tasks.size;
  }
}
