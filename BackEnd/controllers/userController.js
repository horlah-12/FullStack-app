import mongoose from "mongoose";
import userSchema from "../Schema/userSchema.js";


export const register = async (req, res) => {
  try {
    FullName, email, username, password = req.body;
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const login = async (req, res) => {
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

export const getUser = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError(401, "No autorizado", "NOT_AUTHORIZED");
        }

        const user = await getUserService(userId);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};


export const updateUser = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError(401, "No autorizado", "NOT_AUTHORIZED");
        }

        const name = req.body?.name?.trim();
        const username = req.body?.username?.trim();
        const email = req.body?.email?.trim()?.toLowerCase();
        const currentPassword = req.body?.currentPassword;
        const newPassword = req.body?.newPassword;

        const updates = {};
        if (name !== undefined) updates.name = name;
        if (username !== undefined) updates.username = username;
        if (email !== undefined) updates.email = email;

        if (username || email) {
            const conflict = await User.findOne({
                _id: { $ne: userId },
                $or: [
                    ...(username ? [{ username }] : []),
                    ...(email ? [{ email }] : []),
                ],
            });

            if (conflict) {
                const conflictField = conflict.email === email ? "email" : "username";
                throw new AppError(409, `El ${conflictField} ya está registrado`, "USER_CONFLICT");
            }
        }

        if (newPassword) {
            if (!currentPassword) {
                throw new AppError(400, "currentPassword es obligatorio", "BAD_REQUEST");
            }

            const currentUser = await User.findById(userId).select("+password");
            if (!currentUser) {
                throw new AppError(404, "Usuario no encontrado", "USER_NOT_FOUND");
            }

            const isValid = await comparePassword(currentPassword, currentUser.password);
            if (!isValid) {
                throw new AppError(401, "Contraseña actual incorrecta", "INVALID_PASSWORD");
            }

            updates.password = await hashPassword(newPassword);
        }

        const updatedUser = await updateUserService(userId, updates);
        res.status(200).json({ user: updatedUser });
    } catch (error) {
        next(error);
    }
}


export const updateUserImage = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError(401, "No autorizado", "NOT_AUTHORIZED");
        }

        const { imageUrl } = req.body;
        const user = await updateUserImageService(userId, imageUrl);
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
}


export const deleteUser = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            throw new AppError(401, "No autorizado", "NOT_AUTHORIZED");
        }

        const deletedUser = await deleteUserService(userId);
        res.status(200).json({ user: deletedUser });
    } catch (error) {
        next(error);
    }
} 


