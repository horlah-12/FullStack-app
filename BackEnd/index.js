import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import taskRouter from './routes/taskRouter.js';
import userSchema from './Schema/userSchema.js'; // This should be your User model
import userRouter from './routes/userRouter.js';
import path from 'path';

dotenv.config();
const app = express();
const __dirname = path.resolve();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "*"}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self';"
  );
  next();
});

// ========================================
// AUTH ROUTES
// ========================================

// REGISTER
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Register request received:', req.body);
    
    const { name, email, username, password } = req.body;

    // Validate
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await userSchema.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to database
    const newUser = await userSchema.create({
      name,
      email,
      username,
      password: hashedPassword
    });

    console.log('✅ User saved to database:', newUser._id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', req.body);
    
    const { username, password } = req.body;

    // Find user
    const user = await userSchema.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    console.log('✅ User logged in:', username);

    res.json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========================================
// API ROUTES
// ========================================

app.use('/api', userRouter);
app.use('/api', taskRouter);

// ========================================
// STATIC FILES & CATCH-ALL (MUST BE LAST)
// ========================================

app.use(express.static(path.join(__dirname, "../FrontEnd/dist")));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../FrontEnd/dist/index.html"));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB Error:', error);
  });

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});