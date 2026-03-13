import express from 'express';
import bcrypt from 'bcrypt'; // npm install bcrypt
import jwt from 'jsonwebtoken'; // npm install jsonwebtoken
import UserModel from '../Schema/userSchema.js'; // User  from '../Schema/userSchema'; // Adjust path as needed

const router = express.Router();

function getJwtSecret() {
  // Keep this default in sync with other places that sign tokens (e.g. BackEnd/index.js).
  return process.env.JWT_SECRET || 'your-secret-key-change-this';
}

function requireAuth(req, res, next) {
  const header = String(req.headers?.authorization || "");
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized" });
  }

  try {
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    // Validate input
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if user already exists
    const existingUser = await UserModel.findOne({ 
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

    // Create new user
    const newUser = await UserModel.create({
      name,
      email,
      username,
      password: hashedPassword
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, username: newUser.username },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during registration'
    });
  }
});

// Login Route (for reference)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ username });

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
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl ?? null,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// ========================================
// USER PROFILE ROUTES
// ========================================

router.get("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const user = await UserModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        imageUrl: user.imageUrl ?? null,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const current = await UserModel.findById(userId);
    if (!current) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : undefined;
    const emailRaw = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
    const email = typeof emailRaw === "string" ? emailRaw.toLowerCase() : undefined;
    const imageUrl = typeof req.body?.imageUrl === "string" ? req.body.imageUrl.trim() : undefined;
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;

    const wantsPasswordChange = Boolean(newPassword);
    if (wantsPasswordChange && !currentPassword) {
      return res.status(400).json({ success: false, message: "currentPassword is required" });
    }

    if ((username && username !== current.username) || (email && email !== current.email)) {
      const conflict = await UserModel.findOne({
        _id: { $ne: userId },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });
      if (conflict) {
        const field = conflict.email === email ? "email" : "username";
        return res.status(409).json({ success: false, message: `That ${field} is already in use` });
      }
    }

    if (name !== undefined) current.name = name;
    if (username !== undefined) current.username = username;
    if (email !== undefined) current.email = email;
    if (imageUrl !== undefined) current.imageUrl = imageUrl || null;

    if (wantsPasswordChange) {
      const ok = await bcrypt.compare(String(currentPassword), current.password);
      if (!ok) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }
      current.password = await bcrypt.hash(String(newPassword), 10);
    }

    const updated = await current.save();
    return res.json({
      success: true,
      message: "User updated",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        username: updated.username,
        imageUrl: updated.imageUrl ?? null,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      const keys = Object.keys(error.keyPattern || {});
      const field = keys[0] || "field";
      return res.status(409).json({ success: false, message: `That ${field} is already in use` });
    }
    console.error("Update user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/user", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const deleted = await UserModel.findByIdAndDelete(userId).select("-password");
    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User deleted",
      user: {
        id: deleted._id,
        name: deleted.name,
        email: deleted.email,
        username: deleted.username,
        imageUrl: deleted.imageUrl ?? null,
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
