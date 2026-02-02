
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import taskSchema from './Schema/taskSchema.js';
import taskRouter from './routes/taskRouter.js';
import taskController from './controllers/taskController.js';
import path from 'path';


dotenv.config();


const port = process.env.PORT || 3000;


const app = express();
/*const port = process.env.PORT*/

// Middleware to enable CORS


const __dirname = path.resolve(); // Required for ES modules
app.use(express.static(path.join(__dirname, "../FrontEnd/dist"))); // Vite build folder


app.use(cors());

// Middleware to parse JSON and URL-encoded data (Receive JSON data from the client)
app.use(express.json());

// To handle URL-encoded data (e.g., from forms)
app.use(express.urlencoded({ extended: true }));

//Connect to MongoDB

mongoose.connect(process.env.MONGODB_URI)
.then(() => {console.log('Connected to MongoDB');})
.catch((error) => {console.error('Error connecting to MongoDB:', error);});


app.use('/', taskRouter);


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 

