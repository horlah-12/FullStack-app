import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import http from "http";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import taskRouter from './routes/taskRouter.js';
import userRouter from './routes/authRoutes.js';
import userSchema from './Schema/userSchema.js'; // This should be your User model
import path from 'path';
import cloudinaryRouter from './cloudinary.js';
import { fileURLToPath } from 'url';
import fs from 'fs';


dotenv.config();
const app = express();
const server = http.createServer(app);
// Resolve paths relative to this file (Render's CWD is not guaranteed).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: "*"}));
// Allow slightly larger JSON bodies (e.g. if clients send base64 data URLs).
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Security headers
app.use((req, res, next) => {
  res.setHeader(
  "Content-Security-Policy",
  "default-src 'self'; connect-src 'self' https: ws: wss:; img-src 'self' data: blob: https:; media-src 'self' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;"
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
    
    const { name, email, username, password, imageUrl } = req.body;

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
      password: hashedPassword,
      imageUrl: imageUrl || null,
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
        username: newUser.username,
        imageUrl: newUser.imageUrl ?? null,
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
        username: user.username,
        imageUrl: user.imageUrl ?? null,
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

app.use('/api', taskRouter);
app.use('/api', cloudinaryRouter);
app.use('/api', userRouter);


// Optional chat (WebSocket + REST visibility endpoints).
// If the `ws` dependency isn't installed, the API still boots without chat.
let chatEnabled = false;
try {
  const [{ initChatWebSocket }, { default: chatRouter }] = await Promise.all([
    import("./controllers/chatController.js"),
    import("./routes/chatRoutes.js"),
  ]);
  app.use("/api", chatRouter);
  initChatWebSocket(server);
  chatEnabled = true;
} catch (error) {
  console.warn("Chat disabled:", error?.message ?? error);
}

// ========================================
// STATIC FILES & CATCH-ALL (MUST BE LAST)
// ========================================

// ========================================
// STATIC FILES & CATCH-ALL (MUST BE LAST)
// ========================================

const frontendDistPath = path.join(__dirname, "..", "FrontEnd", "dist");
console.log("📁 Frontend dist path:", frontendDistPath);
console.log("📄 Files:", fs.existsSync(frontendDistPath) ? fs.readdirSync(frontendDistPath) : "MISSING");
console.log("🗂️ Assets:", fs.existsSync(path.join(frontendDistPath, "assets")) 
  ? fs.readdirSync(path.join(frontendDistPath, "assets")) 
  : "MISSING");

// Serve static assets FIRST
app.use(express.static(frontendDistPath));

// SPA fallback AFTER static
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  if (path.extname(req.path)) return res.status(404).end();
  res.sendFile(path.join(frontendDistPath, "index.html"));
});



// ========================================
  

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB Error:', error);
  });

server.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  if (chatEnabled) {
    console.log(`Chat WebSocket running at ws://localhost:${port}/ws`);
  }

});
