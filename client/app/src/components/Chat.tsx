import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FloatingLabel, Form, Stack } from "react-bootstrap";
import { io, Socket } from "socket.io-client";

// Constants
const HOST = "https://docusync-server.onrender.com";

// Types
interface MessagePayload {
  msg: string;
  user: string;
  timestamp?: number;
  id?: string;
}

interface User {
  name: string;
  email: string;
}

interface ChatProps {
  users: User[];
  roomid: string;
  socket?: Socket; // Optional socket prop to use existing connection
}

const Chat: React.FC<ChatProps> = ({
  users,
  roomid,
  socket: providedSocket,
}) => {
  // State
  const [message, setMessage] = useState<string>("");
  const [allMsg, setAllMsg] = useState<MessagePayload[]>([]);
  const [connectionError, setConnectionError] = useState<string>("");

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef<number>(0);

  // Use provided socket or create new one
  const socket = useMemo<Socket>(() => {
    if (providedSocket) {
      return providedSocket;
    }
    const newSocket = io(HOST, {
      autoConnect: false, // Don't auto-connect immediately
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });

    // Connect after a delay to ensure server is ready
    setTimeout(() => {
      newSocket.connect();
    }, 1500); // Slightly longer delay than Workspace

    return newSocket;
  }, [providedSocket]);

  // Add connection state tracking
  const [isSocketReady, setIsSocketReady] = useState<boolean>(false);

  // Monitor socket connection status
  useEffect(() => {
    const checkConnection = () => {
      if (socket.connected && socket.id) {
        setIsSocketReady(true);
        setConnectionError("");
      } else {
        setIsSocketReady(false);
      }
    };

    // Check initial connection status
    checkConnection();

    // Set up connection listeners
    const handleConnect = () => {
      setIsSocketReady(true);
      setConnectionError("");
    };

    const handleDisconnect = () => {
      setIsSocketReady(false);
      setConnectionError("Disconnected. Attempting to reconnect...");
    };

    const handleConnectError = (error: any) => {
      setIsSocketReady(false);
      setConnectionError("Connection failed. Retrying...");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket, providedSocket]);

  // Event handlers
  const addMsg = useCallback((payload: MessagePayload) => {
    setAllMsg((prev) => {
      // Check for duplicates using message ID or content + user + timestamp
      const isDuplicate = prev.some(
        (msg) =>
          (payload.id && msg.id === payload.id) ||
          (!payload.id &&
            msg.msg === payload.msg &&
            msg.user === payload.user &&
            Math.abs((msg.timestamp || 0) - (payload.timestamp || 0)) < 1000)
      );

      if (isDuplicate) {
        return prev;
      }

      return [...prev, payload];
    });
  }, []);

  // Socket event handlers for room management
  useEffect(() => {
    if (!roomid || !isSocketReady) return;

    const handleMessage = (payload: MessagePayload) => {
      addMsg(payload);
    };

    const handleError = (error: any) => {
      setConnectionError("Connection error. Please refresh the page.");
    };

    const handleConnect = () => {
      setConnectionError("");
      socket.emit("join-room", roomid);
    };

    const handleDisconnect = () => {
      setConnectionError("Disconnected. Please refresh the page.");
    };

    socket.on("msg", handleMessage);
    socket.on("error", handleError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Join room if already connected
    if (socket.connected) {
      socket.emit("join-room", roomid);
    }

    return () => {
      if (socket.connected) {
        socket.emit("leave-room", roomid);
      }
      socket.off("msg", handleMessage);
      socket.off("error", handleError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, roomid, addMsg, isSocketReady]);

  const handleMsg = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  }, []);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (message.trim()) {
          const trimmedMessage = message.trim();
          const currentUser = users[0]?.name || "Unknown User";
          const timestamp = Date.now();
          const messageId = `msg_${messageIdCounter.current++}_${timestamp}`;

          const payload: MessagePayload = {
            msg: trimmedMessage,
            user: currentUser,
            timestamp,
            id: messageId,
          };

          // Add message to local state immediately for instant display
          addMsg({ ...payload, user: "You" });

          // Clear input immediately
          setMessage("");

          // Send via socket for real-time sync
          if (isSocketReady && socket.connected) {
            socket.emit("msg", payload, roomid);
          } else {
            setConnectionError(
              "Not connected to server. Please wait for connection..."
            );

            // Try to reconnect if not connected
            if (!socket.connected) {
              socket.connect();
            }
          }
        }
      }
    },
    [message, users, socket, roomid, addMsg, isSocketReady]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMsg, scrollToBottom]);

  // Socket event handlers for room management
  useEffect(() => {
    if (!roomid || !isSocketReady) return;

    const handleMessage = (payload: MessagePayload) => {
      addMsg(payload);
    };

    const handleError = (error: any) => {
      setConnectionError("Connection error. Please refresh the page.");
    };

    const handleConnect = () => {
      setConnectionError("");
      socket.emit("join-room", roomid);
    };

    const handleDisconnect = () => {
      setConnectionError("Disconnected. Please refresh the page.");
    };

    socket.on("msg", handleMessage);
    socket.on("error", handleError);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Join room if already connected
    if (socket.connected) {
      socket.emit("join-room", roomid);
    }

    return () => {
      if (socket.connected) {
        socket.emit("leave-room", roomid);
      }
      socket.off("msg", handleMessage);
      socket.off("error", handleError);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket, roomid, addMsg, isSocketReady]);

  // Cleanup socket connection when component unmounts (only if we created it)
  useEffect(() => {
    return () => {
      if (!providedSocket) {
        socket.disconnect();
      }
    };
  }, [socket, providedSocket]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        marginLeft: "1rem",
        gap: "10px",
      }}
    >
      {(connectionError || !isSocketReady) && (
        <div
          style={{
            backgroundColor: connectionError ? "#f8d7da" : "#fff3cd",
            color: connectionError ? "#721c24" : "#856404",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "14px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{connectionError || "Connecting to server..."}</span>
          {connectionError && (
            <button
              onClick={() => socket.connect()}
              style={{
                backgroundColor: "#721c24",
                color: "white",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}
      <div
        className="Chatbox"
        style={{
          backgroundColor: "white",
          overflowY: "auto",
          borderRadius: "8px",
          flex: 1,
          padding: "10px",
        }}
      >
        <Stack>
          {allMsg.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color: "#6c757d",
                fontStyle: "italic",
                padding: "20px",
              }}
            >
              No messages yet. Start the conversation!
            </div>
          ) : (
            allMsg.map((value, index) => {
              return (
                <div
                  key={value.id || index}
                  style={{
                    marginBottom: "8px",
                    padding: "4px 0",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <span
                      style={{
                        color: "#0E2954",
                        fontWeight: "600",
                        paddingRight: "0.5rem",
                      }}
                    >
                      {value.user}:
                    </span>
                    <span style={{ color: "#212529" }}>{value.msg}</span>
                  </p>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Stack>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          height: "60px",
          minHeight: "60px",
        }}
      >
        <div style={{ flex: 1 }}>
          <FloatingLabel
            controlId="floatingInput"
            label="Message"
            style={{
              color: "white",
              backgroundColor: "#213555",
            }}
          >
            <Form.Control
              type="text"
              name="msg"
              required
              onChange={handleMsg}
              onKeyPress={handleKeyPress}
              placeholder="Message"
              style={{ backgroundColor: "#213555", color: "white" }}
              value={message}
            />
          </FloatingLabel>
        </div>
      </div>
    </div>
  );
};
const MemoizedChatComponent = React.memo(Chat);
export default MemoizedChatComponent;
