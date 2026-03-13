import express from 'express';
import userController from '../controllers/userController.js';


const userRouter = express.Router();


userRouter.post('/register', userController.register);
userRouter.get('/login', userController.login);
userRouter.get('/user', userController.getUser);
userRouter.put('/user', userController.updateUser);
userRouter.put('/user/image', userController.updateUserImage);
userRouter.delete('/user', userController.deleteUser);


export default userRouter;


