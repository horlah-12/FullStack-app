import { useEffect, useMemo, useRef, useState } from "react";
import "./ChatPanel.css";
import { apiUrl } from "../services/api.js";

function resolveWsUrl(raw) {
  const value = (raw ?? "").trim() || "/ws";
  if (/^wss?:\/\//i.test(value)) return value;

  let path = value.startsWith("/") ? value : `/${value}`;
  // Vite dev proxy is configured for `/ws`, not `/api/ws`.
  if (path === "/api/ws") path = "/ws";
  const proto = globalThis.location?.protocol === "https:" ? "wss:" : "ws:";
  const host = globalThis.location?.host || "localhost";
  return `${proto}//${host}${path}`;
}

const WS_URL = resolveWsUrl(import.meta.env.VITE_CHAT_WS_URL);

function formatTime(timestampMs) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestampMs));
  } catch {
    return "";
  }
}

function safeId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatPanel() {
  const wsRef = useRef(null);
  const listEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected | error
  const [lastError, setLastError] = useState("");
  const [username, setUsername] = useState(() => localStorage.getItem("chat.username") || "");
  const [room, setRoom] = useState(() => localStorage.getItem("chat.room") || "general");
  const [joined, setJoined] = useState(false);

  const [draft, setDraft] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [messages, setMessages] = useState([]);

  const canSend = useMemo(() => {
    if (!joined || status !== "connected" || uploading) return false;
    return draft.trim().length > 0 || Boolean(attachmentFile);
  }, [attachmentFile, draft, joined, status, uploading]);

  const canAttach = useMemo(() => joined && status === "connected" && !uploading, [joined, status, uploading]);

  const clearAttachment = () => {
    setAttachmentFile(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateAttachment = (file) => {
    if (!file) return { ok: false, error: "No file selected" };

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) return { ok: false, error: "File is too large (max 10MB)" };

    const allowedPrefixes = ["image/", "audio/"];
    const allowedMimes = new Set([
      "application/pdf",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]);

    const ok = allowedPrefixes.some((p) => file.type?.startsWith(p)) || allowedMimes.has(file.type);
    if (!ok) return { ok: false, error: `Unsupported file type: ${file.type || "unknown"}` };

    return { ok: true };
  };

  const uploadAttachment = async (file) => {
    const validation = validateAttachment(file);
    if (!validation.ok) throw new Error(validation.error);

    const fd = new FormData();
    fd.append("file", file);

    const response = await fetch(apiUrl("/upload-file"), {
      method: "POST",
      body: fd,
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : { error: await response.text() };

    if (!response.ok) {
      throw new Error(payload?.error || "Upload failed");
    }

    return {
      url: payload.url,
      mimeType: file.type || payload.mimetype || "",
      filename: file.name,
      size: file.size,
    };
  };

  const connect = () => {
    const name = username.trim();
    const roomName = room.trim();
    if (!name || !roomName) return;

    // Reset any previous connection.
    wsRef.current?.close();

    localStorage.setItem("chat.username", name);
    localStorage.setItem("chat.room", roomName);

    setStatus("connecting");
    setLastError("");
    setUploadError("");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      ws.send(JSON.stringify({ type: "join", username: name, room: roomName }));
      setJoined(true);
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data?.type === "history" && Array.isArray(data.messages)) {
        setMessages(data.messages.map((m) => ({ id: safeId(), ...m })));
        return;
      }

      if (data?.type === "system") {
        setMessages((prev) => [...prev, { id: safeId(), type: "system", message: data.message, ts: data.ts ?? Date.now() }]);
        return;
      }

      if (data?.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: safeId(),
            type: "message",
            username: data.username,
            message: data.message,
            ts: data.ts ?? Date.now(),
            attachment: data.attachment ?? null,
          },
        ]);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setLastError("WebSocket connection error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
      setJoined(false);
      wsRef.current = null;
    };
  };

  const leave = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "leave" }));
    }
    ws?.close();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text && !attachmentFile) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    setUploadError("");

    try {
      let attachment = null;
      if (attachmentFile) {
        setUploading(true);
        attachment = await uploadAttachment(attachmentFile);
      }

      ws.send(JSON.stringify({ type: "message", message: text, attachment }));
      setDraft("");
      clearAttachment();
    } catch (error) {
      setUploadError(error?.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (!listEndRef.current) return;
    listEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    return () => wsRef.current?.close();
  }, []);

  return (
    <aside className="chat-panel" aria-label="Chat">
      <header className="chat-header">
        <div className="chat-title">Chat</div>
        <div className="chat-subtitle">
          {status === "connected" ? `Connected • ${room || "—"}` : status === "connecting" ? "Connecting..." : "Disconnected"}
        </div>
      </header>

      {!joined && (
        <form
          className="chat-join"
          onSubmit={(e) => {
            e.preventDefault();
            connect();
          }}
        >
          <div className="chat-join-row">
            <input
              className="chat-join-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              autoComplete="nickname"
            />
            <input
              className="chat-join-input"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="Room (e.g. general)"
              autoComplete="off"
            />
             <button className="chat-button" type="submit" disabled={status === "connecting"}>
              Join
             </button>
           </div>
          {lastError && <div className="chat-join-hint">{lastError}</div>}
          {import.meta.env.DEV && <div className="chat-join-hint">WS: {WS_URL}</div>}
         </form>
       )}

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((m) => {
          const isSystem = m.type === "system";
          const isMine = m.type === "message" && m.username === username.trim();
          const attachment = m.type === "message" ? m.attachment : null;

          return (
            <div
              key={m.id}
              className={`chat-message ${
                isSystem ? "chat-message--system" : isMine ? "chat-message--user" : "chat-message--assistant"
              }`}
              role="presentation"
            >
              <div className="chat-bubble">
                {m.type === "message" && !isMine && <div className="chat-from">{m.username}</div>}
                {m.message && <div className="chat-text">{m.message}</div>}
                {attachment?.url && (
                  <div className="chat-attachment">
                    {attachment.mimeType?.startsWith("image/") ? (
                      <img className="chat-attachment-image" src={attachment.url} alt={attachment.filename || "attachment"} />
                    ) : attachment.mimeType?.startsWith("audio/") ? (
                      <audio className="chat-attachment-audio" src={attachment.url} controls preload="metadata" />
                    ) : (
                      <a className="chat-attachment-file" href={attachment.url} target="_blank" rel="noreferrer">
                        {attachment.filename || "Download file"}
                      </a>
                    )}
                  </div>
                )}
                <div className="chat-meta">{formatTime(m.ts)}</div>
              </div>
            </div>
          );
        })}
        <div ref={listEndRef} />
      </div>

      <form
        className="chat-composer"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label className="chat-label">Message</label>
        <textarea
          className="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={joined ? "Type a message..." : "Join a room to start chatting..."}
          rows={2}
          disabled={!joined || status !== "connected"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />

        {uploadError && <div className="chat-upload-error">{uploadError}</div>}
        {attachmentFile && (
          <div className="chat-attachment-preview" title={attachmentFile.name}>
            <span className="chat-attachment-name">{attachmentFile.name}</span>
            <button type="button" className="chat-attachment-remove" onClick={clearAttachment} disabled={uploading}>
              Remove
            </button>
          </div>
        )}
        <div className="chat-actions">
          <button type="button" onClick={leave} className="chat-button chat-button--ghost" disabled={!joined || status !== "connected"}>
            Leave
          </button>
          <button
            type="button"
            className="chat-button chat-button--ghost"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
            title="Clear chat"
          >
            Clear
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="chat-file-input"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              if (!file) return;
              const validation = validateAttachment(file);
              if (!validation.ok) {
                setUploadError(validation.error);
                clearAttachment();
                return;
              }
              setUploadError("");
              setAttachmentFile(file);
            }}
          />
          <button
            type="button"
            className="chat-button chat-button--ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAttach}
            title="Attach a file"
          >
            Attach
          </button>
          <button type="submit" className="chat-button" disabled={!canSend}>
            {uploading ? "Uploading..." : "Send"}
          </button>
        </div>
      </form>
    </aside>
  );
}
