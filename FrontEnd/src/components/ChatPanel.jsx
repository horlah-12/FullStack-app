import { useEffect, useMemo, useRef, useState } from "react";
import "./ChatPanel.css";

function resolveWsUrl(raw) {
  const value = (raw ?? "").trim() || "/ws";
  if (/^wss?:\/\//i.test(value)) return value;

  const path = value.startsWith("/") ? value : `/${value}`;
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

  const [status, setStatus] = useState("disconnected"); // disconnected | connecting | connected | error
  const [username, setUsername] = useState(() => localStorage.getItem("chat.username") || "");
  const [room, setRoom] = useState(() => localStorage.getItem("chat.room") || "general");
  const [joined, setJoined] = useState(false);

  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);

  const canSend = useMemo(() => joined && status === "connected" && draft.trim().length > 0, [draft, joined, status]);

  const connect = () => {
    const name = username.trim();
    const roomName = room.trim();
    if (!name || !roomName) return;

    // Reset any previous connection.
    wsRef.current?.close();

    localStorage.setItem("chat.username", name);
    localStorage.setItem("chat.room", roomName);

    setStatus("connecting");

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      setJoined(true);
      ws.send(JSON.stringify({ type: "join", username: name, room: roomName }));
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
          },
        ]);
      }
    };

    ws.onerror = () => setStatus("error");

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

  const send = () => {
    const text = draft.trim();
    if (!text) return;

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: "message", message: text }));
    setDraft("");
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
          {status === "connected" ? `Connected • ${room || "—"}` : status === "connecting" ? "Connecting…" : "Disconnected"}
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
          {import.meta.env.DEV && <div className="chat-join-hint"></div>}
         </form>
       )}

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((m) => {
          const isSystem = m.type === "system";
          const isMine = m.type === "message" && m.username === username.trim();

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
                <div className="chat-text">{m.type === "message" ? m.message : m.message}</div>
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
          placeholder={joined ? "Type a message…" : "Join a room to start chatting…"}
          rows={2}
          disabled={!joined || status !== "connected"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
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
          <button type="submit" className="chat-button" disabled={!canSend}>
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
