import mongoose from "mongoose";
import userSchema from "../Schema/userSchema.js";


const register = async (req, res) => {
  try {
    FullName, email, username, password = req.body;
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    res.json({ message: "Login successful" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

const userController = {
  register,
  login,
};

export default userController;



