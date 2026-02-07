import express from 'express';
import userController from '../controllers/userController.js';


const userRouter = express.Router();


userRouter.post('/register', userController.register);
userRouter.get('/login', userController.login);


export default userRouter;


