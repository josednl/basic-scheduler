export type TaskCallback = () => void | Promise<void>;

export interface Task {
  id: string;
  callback: TaskCallback;
  delay: number;
  repeat?: boolean;
}

export class Scheduler {
  private tasks: Map<string, NodeJS.Timeout> = new Map();

  schedule(task: Task): void {
    if (this.tasks.has(task.id)) {
      this.cancel(task.id);
    }

    const execute = async () => {
      try {
        await task.callback();
      } catch (error) {
        console.error(`Error executing task ${task.id}:`, error);
      } finally {
        if (task.repeat) {
          // If the task was cancelled while executing, don't reschedule
          if (this.tasks.has(task.id)) {
            const timeout = setTimeout(execute, task.delay);
            this.tasks.set(task.id, timeout);
          }
        } else {
          this.tasks.delete(task.id);
        }
      }
    };

    const timeout = setTimeout(execute, task.delay);
    this.tasks.set(task.id, timeout);
  }

  cancel(taskId: string): boolean {
    const timeout = this.tasks.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.tasks.delete(taskId);
      return true;
    }
    return false;
  }

  cancelAll(): void {
    for (const timeout of this.tasks.values()) {
      clearTimeout(timeout);
    }
    this.tasks.clear();
  }

  get activeTasksCount(): number {
    return this.tasks.size;
  }
}
