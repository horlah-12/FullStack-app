import mongoose from 'mongoose'



const taskSchema = new mongoose.Schema({
  title: { type: String, required: true }, // title is a required field of type String,
  description: String,
  dueDate: Date,
  status: { type: String, 
  enum: ['pending', 'in-progress', 'completed'],
  default: 'pending',
  required: true }, // status is a required field of type String
},

{ timestamps: true });





export default taskSchema

