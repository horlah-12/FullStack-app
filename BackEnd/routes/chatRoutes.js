import express from "express";
import chatController from "../controllers/chatController.js";

const chatRouter = express.Router();

// REST endpoints for visibility/debugging.
// Join/leave/send are handled over WebSockets at ws://localhost:<PORT>/ws
chatRouter.get("/rooms", chatController.getAllRooms);
chatRouter.get("/rooms/:room/messages", chatController.getRoomMessages);



export default chatRouter;
