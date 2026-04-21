import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Task {
  id: string;
  delay: number;
  repeat?: boolean;
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<string>('Connecting...');
  
  // Form state
  const [taskId, setTaskId] = useState('');
  const [delay, setDelay] = useState(1000);
  const [repeat, setRepeat] = useState(false);
  const [message, setMessage] = useState('Task executed!');

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
    });

    newSocket.on('notify:executed', (taskId: string) => {
      // If it's not a repeating task, it will be removed by notify:cancelled or notify:list
      // But we can show a temporary notification here if we want
    });

    newSocket.on('notify:cancelled', (taskId: string) => {
      setTasks(prev => prev.filter(t => t.id !== taskId));
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
      </div>

      <div className="status-bar">
        Status: {status}
      </div>
    </div>
  );
};

export default App;
