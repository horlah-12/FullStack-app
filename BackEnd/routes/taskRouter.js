import express from 'express';
import taskController from '../controllers/taskController.js';


const taskRouter = express.Router();

taskRouter.post('/tasks', taskController.createTask);
taskRouter.get('/tasks', taskController.getAllTasks);
taskRouter.get('/tasks/:id', taskController.getTaskById);
taskRouter.put('/tasks/:id', taskController.updateTask);
taskRouter.delete('/tasks/:id', taskController.deleteTask);


export default taskRouter;





