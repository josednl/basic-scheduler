import { Scheduler } from './src/scheduler';

const scheduler = new Scheduler();

console.log('--- Starting demo ---');

// 1. One-time task (1 second delay)
scheduler.schedule({
    id: 'alert',
    delay: 1000,
    callback: () => console.log('1-second alert executed!')
});

// 2. Repeating task (every 500ms)
scheduler.schedule({
    id: 'clock',
    delay: 500,
    repeat: true,
    callback: () => console.log('Tick-tock (every 500ms)...')
});

// Cancel everything after 3 seconds so the script can finish
setTimeout(() => {
    console.log('--- cleaning up and finishing ---');
    scheduler.cancelAll();
}, 3100);
