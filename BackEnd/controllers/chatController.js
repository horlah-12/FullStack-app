import { WebSocket, WebSocketServer } from "ws";

const rooms = new Map();
const MAX_TEXT_LENGTH = 4000;
const MAX_FILENAME_LENGTH = 200;

function getOrCreateRoom(roomName) {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, { clients: new Set(), messages: [] });
  }
  return rooms.get(roomName);
}

function clampText(value, maxLen) {
  const text = String(value ?? "");
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen);
}

function sanitizeAttachment(input) {
  if (!input || typeof input !== "object") return null;

  const url = typeof input.url === "string" ? input.url.trim() : "";
  if (!/^https?:\/\//i.test(url)) return null;

  const mimeType = typeof input.mimeType === "string" ? input.mimeType.trim() : "";
  const filename = clampText(input.filename ?? "", MAX_FILENAME_LENGTH);
  const size = Number.isFinite(input.size) ? input.size : Number(input.size);

  return {
    url,
    mimeType,
    filename: filename || null,
    size: Number.isFinite(size) && size > 0 ? size : null,
  };
}

function broadcast(roomName, payload) {
  const room = rooms.get(roomName);
  if (!room) return;

  const message = JSON.stringify(payload);
  room.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function safeParseJson(raw) {
  try {
    const text = typeof raw === "string" ? raw : raw.toString("utf8");
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error };
  }
}

function leaveCurrentRoom(ws) {
  const roomName = ws.room;
  const username = ws.username;
  if (!roomName) return;

  const room = rooms.get(roomName);
  if (!room) return;

  room.clients.delete(ws);

  if (username) {
    const payload = { type: "system", message: `${username} has left the chat`, ts: Date.now() };
    room.messages.push(payload);
    broadcast(roomName, payload);
  }

  if (room.clients.size === 0) {
    rooms.delete(roomName);
  }

  ws.room = null;
  ws.username = null;
}

/**
 * Attach the chat WebSocket server to an existing HTTP server.
 * Clients should connect to: ws://localhost:<PORT>/ws
 */
function initChatWebSocket(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws) => {
    ws.room = null;
    ws.username = null;

    ws.on("message", (raw) => {
      const parsed = safeParseJson(raw);
      if (!parsed.ok) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON payload" }));
        return;
      }

      const data = parsed.value;
      const type = data?.type;

      if (type === "join") {
        const roomName = String(data?.room ?? "").trim();
        const username = String(data?.username ?? "").trim();
        if (!roomName || !username) {
          ws.send(JSON.stringify({ type: "error", message: "join requires { room, username }" }));
          return;
        }

        if (ws.room) leaveCurrentRoom(ws);

        ws.room = roomName;
        ws.username = username;

        const room = getOrCreateRoom(roomName);
        room.clients.add(ws);

        ws.send(JSON.stringify({ type: "history", room: roomName, messages: room.messages }));

        const payload = { type: "system", message: `${username} has joined the chat`, ts: Date.now() };
        room.messages.push(payload);
        broadcast(roomName, payload);
        return;
      }

      if (type === "message") {
        const roomName = ws.room;
        const username = ws.username;
        const messageText = clampText(String(data?.message ?? "").trim(), MAX_TEXT_LENGTH);
        const attachment = sanitizeAttachment(data?.attachment);

        if (!roomName || !username) {
          ws.send(JSON.stringify({ type: "error", message: "You must join a room first" }));
          return;
        }
        if (!messageText && !attachment) return;

        const room = getOrCreateRoom(roomName);
        const payload = { type: "message", username, message: messageText, ts: Date.now(), attachment };
        room.messages.push(payload);
        broadcast(roomName, payload);
        return;
      }

      if (type === "leave") {
        leaveCurrentRoom(ws);
        return;
      }

      ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    });

    ws.on("close", () => leaveCurrentRoom(ws));
  });

  return wss;
}

const getAllRooms = (req, res) => {
  const roomsArray = Array.from(rooms.entries()).map(([name, room]) => ({
    name,
    clients: room.clients.size,
    messages: room.messages.length,
  }));
  res.json(roomsArray);
};

const getRoomMessages = (req, res) => {
  const roomName = String(req.params.room ?? "").trim();
  if (!roomName) return res.status(400).json({ error: "room is required" });

  const room = rooms.get(roomName);
  if (!room) return res.status(404).json({ error: "room not found" });

  res.json({ room: roomName, messages: room.messages });
};

const chatController = {
  getAllRooms,
  getRoomMessages,
};

export { initChatWebSocket };
export default chatController;

