import "./TaskForm.css";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function TaskForm({ onAddTask, taskToEdit, onEditTask, onViewAllTasks, onCancelEdit }) {

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [status, setStatus] = useState("pending");
    const navigate = useNavigate();

    useEffect(() => {
        if (taskToEdit) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTitle(taskToEdit.title || "");
            setDescription(taskToEdit.description || "");
            // Format date from ISO string to YYYY-MM-DD for input field
            const formattedDate = taskToEdit.dueDate 
                ? new Date(taskToEdit.dueDate).toISOString().split('T')[0]
                : "";
            setDueDate(formattedDate);
            setStatus(taskToEdit.status || "pending");
        }
    }, [taskToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();

       if (!title || !description || !dueDate) {
            alert("Please fill in all fields.");
            return;
        }

        try {
          if (taskToEdit) {
            await onEditTask(taskToEdit._id, {
                title,
                description,
                dueDate,
                status,
            });
          } else {
            await onAddTask({
                title,
                description,
                dueDate,
                status,
            });
            navigate("/congratulations");
          }
        } catch {
          return;
        }

        // Clear form after submission
        setTitle("");
        setDescription("");
        setDueDate("");
        setStatus("pending");
    };

    const handleCancel = () => {
        setTitle("");
        setDescription("");
        setDueDate("");
        setStatus("pending");
        onCancelEdit?.();
    };
    return (

          <div className="task-form">
        <form onSubmit={handleSubmit}>
            <ul>
                <input
                    type="text"
                    placeholder="Task Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                </ul>

                <ul>
                <textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                </ul>

                <ul>
                <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                />
                </ul>

                <ul>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                </select>
                </ul>

                <button type="submit" > {taskToEdit ? "Update Task" : "Add Task"} </button>
                <button type="button" onClick={onViewAllTasks} style={{ marginLeft: "10px", backgroundColor: "#0066cc" }}>
                    👁 View All Tasks
                </button>
                {taskToEdit && (
                    <button type="button" onClick={handleCancel} style={{ marginLeft: "10px", backgroundColor: "#999" }}>
                        Cancel Edit
                    </button>
                )}
                  
            </form>
    </div>
    );

}

