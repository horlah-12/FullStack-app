import React from 'react'
import { useState } from 'react'
import TaskForm from './components/TaskForm.jsx'
import TaskList from './components/TaskList.jsx'
import Congratulations from './components/congratulations.jsx'
import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import { set } from 'mongoose'

// Get API base URL from environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://fullstack-app-82dv.onrender.com/"


function App() {
 
 const [tasks, setTasks] = useState([])
 const [filter, setFilter] = useState("all")
 const [sort, setSort] = useState("dueDateAsc")
 const [taskToEdit, setTaskToEdit] = useState(null)
 const [emptyMessage, setEmptyMessage] = useState("")
 const [notification, setNotification] = useState({ message: '', type: '', visible: false })

 // Helper function to show notifications
 const showNotification = (message, type = 'success') => {
   setNotification({ message, type, visible: true });
   // Auto-hide notification after 3 seconds
   setTimeout(() => {
     setNotification(prev => ({ ...prev, visible: false }));
   }, 3000);
 };
 
 // Fetch tasks on component mount and when filter/sort changes
 React.useEffect(() => {
  
  
  const fetchTasks = async () => {
     try {
       // Build query parameters
       const params = new URLSearchParams();
       
       if (filter !== "all") {
         params.append('status', filter);
       }
       params.append('sort', sort);

       const response = await fetch(`${API_BASE_URL}/tasks?${params.toString()}`);
       
       // Handle 404 response for empty tasks
       if (response.status === 404) {
         const errorData = await response.json();
         setTasks([]);
         setEmptyMessage(errorData.message);
         console.log('No tasks found:', errorData.message);
         return;
       }
       
       if (!response.ok) {
         throw new Error('Failed to fetch tasks');
       }
       
       const data = await response.json();
       setTasks(Array.isArray(data) ? data : []);
       setEmptyMessage("");
       console.log('Tasks fetched with filter:', filter, 'sort:', sort);
     } catch (error) {
       console.error('Error fetching tasks:', error);
       setTasks([]);
       setEmptyMessage('Error loading tasks. Please try again.');
     }
   };
   fetchTasks();
 }, [filter, sort]);




 const addTask = async (task) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
      
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Network response was not ok');
    }

    const savedTask = await response.json();
    setTasks((prevtasks) => [...prevtasks, savedTask]);
    setTaskToEdit(null);
  
    console.log('Success:', savedTask);
    showNotification("TO-DO TASK SENT SUCCESSFULLY TO DATABASE", 'success');
  } catch (error) {
    console.error('Error:', error);
    showNotification(error.message || 'Failed to add task', 'error');
  }
};  

 const deleteTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete task');
    }

    setTasks(tasks.filter((task) => task._id !== taskId));
    showNotification('TASK DELETED SUCCESSFULLY', 'success');
    console.log('Task deleted successfully');
  } catch (error) {
    console.error('Error deleting task:', error);
    showNotification('Failed to delete task', 'error');
  }
};    


 const toggleTaskStatus = async (taskId) => {
  try {
    // Find the current task to get its status
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Calculate new status
    const newStatus = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : "pending";

    console.log(`Toggling task ${taskId} from ${task.status} to ${newStatus}`);

    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Failed to update task status');
    }

    const updatedTask = await response.json();
    setTasks(
      tasks.map((task) =>
        task._id === taskId ? updatedTask : task
      )
    );
    showNotification('Task status updated successfully!', 'success');
    console.log('Task status updated successfully:', updatedTask);
  } catch (error) {
    console.error('Error toggling task status:', error);
    showNotification('Failed to update task status', 'error');
  }
};

const editTask = async (taskId, updatedTask) => {
  try {
    console.log('Sending update request for task:', taskId, updatedTask);
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedTask),
    });

    if (!response.ok) {
      throw new Error('Failed to update task');
    }

    const savedTask = await response.json();
    console.log('Task updated from server:', savedTask);
    setTasks(
      tasks.map((task) => (task._id === taskId ? savedTask : task))
    );
    setTaskToEdit(null);
    showNotification("TASK UPDATED SUCCESSFULLY", 'success');
    
  } catch (error) {
    console.error('Error updating task:', error);
    showNotification('Failed to update task', 'error');
  }
};

const viewTask = async (taskId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch task details');
    }

    const task = await response.json();
    setTaskToEdit(task);
    showNotification('Task loaded for viewing/editing', 'success');
    console.log('Task details loaded:', task);
  } catch (error) {
    console.error('Error viewing task:', error);
    showNotification('Failed to load task details', 'error');
  }
};

const viewAllTasks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) {
      const errorData = await response.json();
      setTasks([]);
      setEmptyMessage(errorData.message);
      showNotification('No tasks found in database', 'info');
      return;
    }

    if (!response.ok) {
      throw new Error('Failed to fetch all tasks');
    }

    const data = await response.json();
    setTasks(Array.isArray(data) ? data : []);
    setEmptyMessage("");
    setFilter("all");
    showNotification('All tasks loaded successfully', 'success');
    console.log('All tasks fetched:', data);
  } catch (error) {
    console.error('Error fetching all tasks:', error);
    showNotification('Failed to load all tasks', 'error');
  }
};

const handleEditClick = (task) => {
  setTaskToEdit(task)
};

// No need for frontend filtering/sorting - backend handles it
 return (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={
        <div className="TaskList">
          {/* Notification Display */}
          {notification.visible && (
            <div className={`notification notification-${notification.type}`}>
              {notification.message}
            </div>
          )}
          
          <h1>Application TO-DO</h1>
          <TaskForm onAddTask={addTask} taskToEdit={taskToEdit} onEditTask={editTask} onViewAllTasks={viewAllTasks}/>

          <div className='controls'>
              <label>Filter Tasks:</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In-progress</option>
                  <option value="completed">Completed</option>
              </select>

              <label>Sort by due Date:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="dueDateAsc">Ascending</option>
                  <option value="dueDateDesc">Descending</option>
              </select>
          </div>
          
          <TaskList 
          tasks={tasks} 
          emptyMessage={emptyMessage}
          onToggle={toggleTaskStatus} 
          onDelete={deleteTask} 
          onEdit={handleEditClick}
          onView={viewTask}
          />
        </div>
      } />
      <Route path="/" element={<Navigate to="/tasks" replace />} />
      <Route path="/CONGRATULATIONS" element={<Congratulations />} />
    </Routes>
  </BrowserRouter>
  )
}

export default App
