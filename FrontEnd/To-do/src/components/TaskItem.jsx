import "./TaskItem.css";

function TaskItem({ task, onToggle, onDelete, onEdit, onView }) {
   
  if(!task) return null;

  // Format date from ISO string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  return (
    <div className="task-item">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
      </div>

      <p className="task-description">{task.description}</p>

      <div className="task-meta">
        <span className="due-date">📅 {formatDate(task.dueDate)}</span>
        <span className={`status-badge ${task.status}`}>{task.status}</span>
      </div>

      <div className="task-footer">
        <div className="task-buttons">
          <button className="task-btn view-btn" onClick={() => onView(task._id)}>
            👁 View
          </button>
          <button className="task-btn toggle-btn" onClick={() => onToggle(task._id)}>
            ✓ Toggle
          </button>
          <button className="task-btn toggle-btn" onClick={() => onEdit(task)}>
            ✎ Edit
          </button>
          <button className="task-btn delete-btn" onClick={() => onDelete(task._id)}>
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskItem;

