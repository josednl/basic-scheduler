import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Task {
  id: string;
  delay: number;
  repeat?: boolean;
}

interface Notification {
  id: string;
  taskId: string;
  type: 'executed' | 'failed' | 'cancelled' | 'scheduled';
  timestamp: Date;
  message?: string;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  
  // Form state
  const [taskId, setTaskId] = useState('');
  const [delay, setDelay] = useState(1000);
  const [repeat, setRepeat] = useState(false);
  const [message, setMessage] = useState('Task executed!');

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep last 10
  };

  useEffect(() => {
    const newSocket = io(); // Connects to the same host
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setStatus('Connected to Scheduler');
    });

    newSocket.on('disconnect', () => {
      setStatus('Disconnected');
    });

    newSocket.on('notify:list', (initialTasks: Task[]) => {
      setTasks(initialTasks);
    });

    newSocket.on('notify:scheduled', (task: Task) => {
      setTasks(prev => {
        if (prev.find(t => t.id === task.id)) return prev;
        return [...prev, task];
      });
      addNotification({ taskId: task.id, type: 'scheduled' });
    });

    newSocket.on('notify:executed', (taskId: string) => {
      addNotification({ taskId, type: 'executed' });
      
      // Remove from active tasks if it was a one-time task
      setTasks(prev => {
        const task = prev.find(t => t.id === taskId);
        if (task && !task.repeat) {
          return prev.filter(t => t.id !== taskId);
        }
        return prev;
      });
    });

    newSocket.on('notify:failed', (data: { taskId: string, error: string }) => {
      addNotification({ taskId: data.taskId, type: 'failed', message: data.error });
    });

    newSocket.on('notify:cancelled', (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addNotification({ taskId, type: 'cancelled' });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !taskId) return;

    socket.emit('request:schedule', {
      id: taskId,
      delay: Number(delay),
      repeat,
      message
    });
    
    setTaskId('');
  };

  const handleCancel = (id: string) => {
    if (!socket) return;
    socket.emit('request:cancel', id);
  };

  return (
    <div>
      <h1>Scheduler Dashboard</h1>
      
      <div className="dashboard">
        <div className="card">
          <h2>Add New Task</h2>
          <form onSubmit={handleSchedule}>
            <div className="form-group">
              <label>Task ID:</label>
              <input 
                type="text" 
                value={taskId} 
                onChange={e => setTaskId(e.target.value)} 
                placeholder="e.g. cleanup-logs"
                required
              />
            </div>
            <div className="form-group">
              <label>Delay (ms):</label>
              <input 
                type="number" 
                value={delay} 
                onChange={e => setDelay(Number(e.target.value))} 
                min="0"
              />
            </div>
            <div className="form-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={repeat} 
                  onChange={e => setRepeat(e.target.checked)} 
                />
                Repeat Task
              </label>
            </div>
            <div className="form-group">
              <label>Message:</label>
              <input 
                type="text" 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
              />
            </div>
            <button type="submit">Schedule Task</button>
          </form>
        </div>

        <div className="card">
          <h2>Active Tasks ({tasks.length})</h2>
          {tasks.length === 0 ? (
            <p>No active tasks.</p>
          ) : (
            <ul>
              {tasks.map(task => (
                <li key={task.id}>
                  <div className="task-info">
                    <span className="task-id">{task.id}</span>
                    <span className="task-meta">
                      {task.delay}ms | {task.repeat ? 'Repeating' : 'One-time'}
                    </span>
                  </div>
                  <button 
                    className="cancel" 
                    onClick={() => handleCancel(task.id)}
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card full-width">
          <h2>Notifications Log</h2>
          {notifications.length === 0 ? (
            <p>No recent activity.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map(n => (
                <li key={n.id} className={`notification ${n.type}`}>
                  <span className="notif-time">{n.timestamp.toLocaleTimeString()}</span>
                  <span className="notif-type">[{n.type.toUpperCase()}]</span>
                  <span className="notif-task">Task: {n.taskId}</span>
                  {n.message && <span className="notif-msg">- {n.message}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="status-bar">
        Status: {status}
      </div>
    </div>
  );
};

export default App;
