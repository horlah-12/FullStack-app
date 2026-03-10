import React, { useState } from "react";
import TaskForm from "../components/TaskForm.jsx";
import TaskList from "../components/TaskList.jsx";
import { apiUrl } from "../services/api.js";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("dueDateAsc");
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [emptyMessage, setEmptyMessage] = useState("");
  const [notification, setNotification] = useState({
    message: "",
    type: "",
    visible: false,
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  React.useEffect(() => {
    const fetchTasks = async () => {
      try {
        const params = new URLSearchParams();
        if (filter !== "all") params.append("status", filter);
        params.append("sort", sort);

        const response = await fetch(apiUrl(`/tasks?${params.toString()}`));

        if (response.status === 404) {
          const errorData = await response.json();
          setTasks([]);
          setEmptyMessage(errorData.message);
          return;
        }

        if (!response.ok) throw new Error("Failed to fetch tasks");

        const data = await response.json();
        setTasks(Array.isArray(data) ? data : []);
        setEmptyMessage("");
      } catch (error) {
        console.error("Error fetching tasks:", error);
        setTasks([]);
        setEmptyMessage("Error loading tasks. Please try again.");
      }
    };

    fetchTasks();
  }, [filter, sort]);

  const addTask = async (task) => {
    try {
      const response = await fetch(apiUrl("/tasks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Network response was not ok");
      }

      const savedTask = await response.json();
      setTasks((prevTasks) => [...prevTasks, savedTask]);
      setTaskToEdit(null);
      showNotification("TO-DO TASK SENT SUCCESSFULLY TO DATABASE", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification(error.message || "Failed to add task", "error");
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(apiUrl(`/tasks/${taskId}`), {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setTasks((prev) => prev.filter((task) => task._id !== taskId));
      showNotification("TASK DELETED SUCCESSFULLY", "success");
    } catch (error) {
      console.error("Error deleting task:", error);
      showNotification("Failed to delete task", "error");
    }
  };

  const toggleTaskStatus = async (taskId) => {
    try {
      const task = tasks.find((t) => t._id === taskId);
      if (!task) return;

      const newStatus =
        task.status === "pending"
          ? "in-progress"
          : task.status === "in-progress"
            ? "completed"
            : "pending";

      const response = await fetch(apiUrl(`/tasks/${taskId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update task status");

      const updatedTask = await response.json();
      setTasks((prev) => prev.map((t) => (t._id === taskId ? updatedTask : t)));
      showNotification("Task status updated successfully!", "success");
    } catch (error) {
      console.error("Error toggling task status:", error);
      showNotification("Failed to update task status", "error");
    }
  };

  const editTask = async (taskId, updatedTask) => {
    try {
      const response = await fetch(apiUrl(`/tasks/${taskId}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTask),
      });

      if (!response.ok) throw new Error("Failed to update task");

      const savedTask = await response.json();
      setTasks((prev) => prev.map((t) => (t._id === taskId ? savedTask : t)));
      setTaskToEdit(null);
      showNotification("TASK UPDATED SUCCESSFULLY", "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showNotification("Failed to update task", "error");
    }
  };

  const viewTask = async (taskId) => {
    try {
      const response = await fetch(apiUrl(`/tasks/${taskId}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch task details");

      const task = await response.json();
      setTaskToEdit(task);
      showNotification("Task loaded for viewing/editing", "success");
    } catch (error) {
      console.error("Error viewing task:", error);
      showNotification("Failed to load task details", "error");
    }
  };

  const viewAllTasks = async () => {
    try {
      const response = await fetch(apiUrl("/tasks"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        const errorData = await response.json();
        setTasks([]);
        setEmptyMessage(errorData.message);
        showNotification("No tasks found in database", "info");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch all tasks");

      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
      setEmptyMessage("");
      setFilter("all");
      showNotification("All tasks loaded successfully", "success");
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      showNotification("Failed to load all tasks", "error");
    }
  };

  const handleEditClick = (task) => setTaskToEdit(task);

  return (
    <div className="TaskList">
      {notification.visible && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      <h1>Application TO-DO</h1>
      <TaskForm
        onAddTask={addTask}
        taskToEdit={taskToEdit}
        onEditTask={editTask}
        onViewAllTasks={viewAllTasks}
      />

      <div className="controls">
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
  );
}

