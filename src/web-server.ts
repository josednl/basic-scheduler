import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Scheduler, Task } from './scheduler.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

const scheduler = new Scheduler();
await scheduler.load();

// Forward scheduler events to Socket.io
scheduler.on('task:scheduled', (task: Task) => {
  io.emit('notify:scheduled', {
    id: task.id,
    delay: task.delay,
    repeat: task.repeat
  });
});

scheduler.on('task:executed', (taskId: string) => {
  io.emit('notify:executed', taskId);
});

scheduler.on('task:cancelled', (taskId: string) => {
  io.emit('notify:cancelled', taskId);
});

scheduler.on('task:failed', (taskId: string, error: any) => {
  io.emit('notify:failed', { taskId, error: error.message });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial task list
  socket.emit('notify:list', scheduler.listTasks().map(t => ({
    id: t.id,
    delay: t.delay,
    repeat: t.repeat
  })));

  socket.on('request:schedule', (data: { id: string, delay: number, repeat?: boolean, message: string }) => {
    scheduler.schedule({
      id: data.id,
      delay: data.delay,
      repeat: data.repeat,
      metadata: { message: data.message },
      callback: () => {
        console.log(`[WEB TASK ${data.id}] ${data.message}`);
      }
    });
  });

  socket.on('request:cancel', (taskId: string) => {
    scheduler.cancel(taskId);
  });

  socket.on('request:cancelAll', () => {
    scheduler.cancelAll();
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Web Dashboard server running on http://localhost:${PORT}`);
});
