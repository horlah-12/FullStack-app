import "./TaskList.css";
import TaskItem from "./TaskItem";


function TaskList({ tasks, emptyMessage, onToggle, onDelete, onEdit, onView }) {

    if (tasks.length === 0) {
        return (
            <div className="empty-state">
                <h2>📭 No Tasks Found</h2>
                <p>{emptyMessage || "No tasks available. Create one to get started!"}</p>
            </div>
        );
    }


  return (
    <div>
      <h2>Available Task List</h2>
      <ul>
        {tasks.map((task) => (
          <TaskItem 
          key={task._id} 
          task={task} 
          onToggle={onToggle} 
          onDelete={onDelete} 
          onEdit={onEdit}
          onView={onView}
          />
        ))}
      </ul>
    </div>
    
  );
  
}


export default TaskList;

