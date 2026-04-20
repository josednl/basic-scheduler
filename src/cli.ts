import inquirer from 'inquirer';
import { Scheduler } from './scheduler.js';

const scheduler = new Scheduler();

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
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Add Task',
        'List Tasks',
        'Cancel Task',
        'Cancel All',
        'Exit'
      ]
    }
  ]);

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

  await mainMenu();
}

async function addTask() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: 'Task ID:',
      validate: (input) => input.trim() !== '' ? true : 'ID is required'
    },
    {
      type: 'number',
      name: 'delay',
      message: 'Delay (ms):',
      default: 1000,
      validate: (input: number | undefined) => (input !== undefined && !isNaN(input) && input >= 0) ? true : 'Delay must be a positive number'
    },
    {
      type: 'confirm',
      name: 'repeat',
      message: 'Repeat task?',
      default: false
    },
    {
      type: 'input',
      name: 'message',
      message: 'Log message:',
      default: 'Task executed!'
    }
  ]);

  scheduler.schedule({
    id: answers.id,
    delay: answers.delay,
    repeat: answers.repeat,
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

  const { taskId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'taskId',
      message: 'Select task to cancel:',
      choices: tasks.map(t => t.id)
    }
  ]);

  scheduler.cancel(taskId);
}

console.log('Welcome to Basic Scheduler CLI!');
mainMenu().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
