import mongoose from "mongoose";
import taskSchema from "../Schema/taskSchema.js";
import userSchema from "../Schema/userSchema.js";

const Task = mongoose.model("Task", taskSchema);

const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { status, sort } = req.query;

    // Build filter object
    let filter = {};
    let filterDescription = "all tasks";
    if (status && status !== "all") {
      filter.status = status;
      filterDescription = `${status} tasks`;
    }

    // Build sort object
    let sortOptions = {};
    let sortDescription = "ascending due date";
    if (sort === "dueDateAsc") {
      sortOptions.dueDate = 1;
      sortDescription = "ascending due date";
    } else if (sort === "dueDateDesc") {
      sortOptions.dueDate = -1;
      sortDescription = "descending due date";
    }

    // Fetch tasks with filter and sort
    const tasks = await Task.find(filter).sort(sortOptions);

    if (tasks.length === 0) {
      return res.status(404).json({
        message: `No ${filterDescription} found sorted by ${sortDescription}. Please create a new task or adjust your filters.`,
        filterApplied: status || "all",
        sortApplied: sort || "dueDateAsc",
      });
    }

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const taskController = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};

export default taskController;
