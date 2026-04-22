import pkg from 'enquirer';
const { prompt } = pkg;
import { Scheduler } from './scheduler.js';

/**
 * Interactive CLI for managing scheduled tasks.
 */
const scheduler = new Scheduler();
await scheduler.load();

// Set up event listeners for feedback
scheduler.on('task:scheduled', (task) => {
  console.log(`\n[EVENT] Task scheduled: ${task.id} (delay: ${task.delay}ms, repeat: ${task.repeat ?? false})`);
});

scheduler.on('task:executed', (taskId) => {
  console.log(`\n[EVENT] Task executed: ${taskId}`);
});

scheduler.on('task:cancelled', (taskId) => {
  console.log(`\n[EVENT] Task cancelled: ${taskId}`);
});

scheduler.on('task:failed', (taskId, error) => {
  console.error(`\n[EVENT] Task failed: ${taskId}:`, error);
});

async function mainMenu() {
  try {
    const { action }: any = await prompt({
      type: 'select',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Add Task',
        'List Tasks',
        'Cancel Task',
        'Cancel All',
        'Exit'
      ]
    });

    switch (action) {
      case 'Add Task':
        await addTask();
        break;
      case 'List Tasks':
        listTasks();
        break;
      case 'Cancel Task':
        await cancelTask();
        break;
      case 'Cancel All':
        scheduler.cancelAll();
        console.log('All tasks cancelled.');
        break;
      case 'Exit':
        scheduler.cancelAll();
        console.log('Goodbye!');
        process.exit(0);
    }
  } catch (err) {
    // If we catch an error (like Ctrl+C), exit gracefully
    process.exit(0);
  }

  await mainMenu();
}

async function addTask() {
  const answers: any = await prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Task ID:',
      validate: (input: string) => input.trim() !== '' ? true : 'ID is required'
    },
    {
      type: 'numeral',
      name: 'delay',
      message: 'Delay (ms):',
      initial: 1000
    },
    {
      type: 'confirm',
      name: 'repeat',
      message: 'Repeat task?',
      initial: false
    },
    {
      type: 'input',
      name: 'message',
      message: 'Log message:',
      initial: 'Task executed!'
    }
  ]);

  scheduler.schedule({
    id: answers.id,
    delay: answers.delay,
    repeat: answers.repeat,
    metadata: { message: answers.message },
    callback: () => {
      console.log(`\n[TASK ${answers.id}] ${answers.message}`);
    }
  });
}

function listTasks() {
  const tasks = scheduler.listTasks();
  if (tasks.length === 0) {
    console.log('No active tasks.');
  } else {
    console.log('\n--- Active Tasks ---');
    tasks.forEach(t => {
      console.log(`ID: ${t.id} | Delay: ${t.delay}ms | Repeat: ${t.repeat ?? false}`);
    });
    console.log('--------------------');
  }
}

async function cancelTask() {
  const tasks = scheduler.listTasks();
  if (tasks.length === 0) {
    console.log('No tasks to cancel.');
    return;
  }

  const { taskId }: any = await prompt({
    type: 'select',
    name: 'taskId',
    message: 'Select task to cancel:',
    choices: tasks.map(t => t.id)
  });

  scheduler.cancel(taskId);
}

console.log('Welcome to Basic Scheduler CLI!');
mainMenu().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
