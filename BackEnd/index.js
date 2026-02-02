
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
const __dirname = path.resolve(); // required for ES modules


app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';"
  );
  next();
});

app.use(cors({
  origin: "*", // for testing, or your frontend URL for production
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../FrontEnd/dist")));; // Vite build folder


app.use('/', taskRouter);


// Catch-all route to serve index.html for any unknown route
/*
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/dist/index.html"));
}); */



//Connect to MongoDB

mongoose.connect(process.env.MONGODB_URI)
.then(() => {console.log('Connected to MongoDB');})
.catch((error) => {console.error('Error connecting to MongoDB:', error);});





app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
}); 

