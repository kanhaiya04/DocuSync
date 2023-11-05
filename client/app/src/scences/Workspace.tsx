import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Modal,
  Row,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
// Socket connection is handled by CollaborativeEditor
import toast from "react-hot-toast";
import "../components/QuillEditor.css";
import NavBar from "../global/Navbar";
import userContext from "../content/Users/usersContent";
import MemoizedChatComponent from "../components/Chat";
import CollaborativeEditor from "../components/CollaborativeEditor";

// Constants
const HOST = "https://docusync-server.onrender.com";

// Types

interface ConfigStore {
  getSecret(): string;
}

interface WorkspaceProps {}

interface DocumentData {
  content: string;
  title: string;
}

interface ApiResponse {
  success: boolean;
  response?: DocumentData;
  msg?: string;
  err?: string;
}

const Workspace: React.FC<WorkspaceProps> = () => {
  // State
  const [doc, setDoc] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [showJoin, setShowJoin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sharedSocket, setSharedSocket] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<
    Array<{ userId: string; userName: string; color: string }>
  >([]);

  // Hooks
  const { roomid } = useParams<{ roomid: string }>();
  const configStore = (window as any).configStore as ConfigStore;
  const { users, getUser } = useContext(userContext);

  // Socket connection is now handled by CollaborativeEditor
  // No need for separate socket connection in Workspace

  // Event handlers
  const handleJoinClose = useCallback(() => setShowJoin(false), []);

  const getDoc = useCallback(async () => {
    if (!roomid) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/doc/getdoc?id=${roomid}`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: ApiResponse = await response.json();
      if (json.success && json.response) {
        setDoc(json.response.content || "");
        setTitle(json.response.title || "");
      } else {
        toast.error(
          json.msg || json.err || "Failed to load document. Please try again."
        );
      }
    } catch (error) {
      console.error("Get doc error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [roomid]);

  // Load document and user on mount
  useEffect(() => {
    getDoc();
    getUser(); // Get current user information
  }, [getDoc, getUser]);

  // Debug: Log users array to see what we're getting
  useEffect(() => {
    console.log("Users array:", users);
    if (users.length > 0) {
      console.log("Current user name:", users[0].name);
    }
  }, [users]);

  // Socket events are now handled by CollaborativeEditor

  const updateEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRoomJoin = useCallback(async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!roomid) {
      toast.error("No room ID found");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/user/join`, {
        method: "POST",
        headers: {
          token: configStore.getSecret(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, roomId: roomid }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: ApiResponse = await response.json();
      if (json.success) {
        toast.success("User added to workspace successfully!");
        setEmail("");
      } else {
        toast.error(
          json.msg ||
            json.err ||
            "Failed to add user to workspace. Please try again."
        );
      }
    } catch (error) {
      console.error("Join room error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
      handleJoinClose();
    }
  }, [email, roomid, configStore, handleJoinClose]);

  // Collaborative editor handlers
  const handleCollaborativeSave = useCallback(
    async (content: string) => {
      if (!roomid) {
        toast.error("No document ID found");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`${HOST}/doc/updatedoc`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            token: configStore.getSecret(),
          },
          body: JSON.stringify({ _id: roomid, content }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json: ApiResponse = await response.json();
        if (json.success) {
          toast.success("Document saved successfully!");
        } else {
          toast.error(
            json.msg || json.err || "Failed to save document. Please try again."
          );
        }
      } catch (error) {
        console.error("Save error:", error);
        toast.error(
          "Network error. Please check your connection and try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [roomid, configStore]
  );

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
  }, []);

  const handleSocketReady = useCallback((socket: any) => {
    console.log("Socket ready callback received:", socket.id);
    setSharedSocket(socket);
  }, []);

  const handleConnectedUsersChange = useCallback(
    (users: Array<{ userId: string; userName: string; color: string }>) => {
      setConnectedUsers(users);
    },
    []
  );

  return (
    <Container
      fluid
      className="p-0 vh-100"
      style={{ backgroundColor: "#213555", height: "100vh", color: "white" }}
    >
      <>
        <Modal show={showJoin} onHide={handleJoinClose}>
          <Modal.Header closeButton>
            <Modal.Title>Add person</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FloatingLabel controlId="floatingInput" label="Email">
              <Form.Control
                type="text"
                name="roomId"
                required
                onChange={updateEmail}
              />
            </FloatingLabel>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleJoinClose}>
              Close
            </Button>
            <Button
              variant="primary"
              style={{
                borderColor: "#213555",
                color: "white",
                backgroundColor: "#213555",
              }}
              disabled={isLoading}
              onClick={handleRoomJoin}
            >
              {isLoading ? "Adding..." : "Add"}
            </Button>
          </Modal.Footer>
        </Modal>
      </>
      <NavBar title="Workspace" />
      <Container className="pt-4 main-container">
        <Row className="pt-2" style={{ flexShrink: 0 }}>
          <Col>
            <h1>{title}</h1>
          </Col>
          <Col
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "15px",
            }}
          >
            {/* User Avatars */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
              }}
            >
              {/* Current User */}
              <div
                style={{
                  position: "relative",
                  cursor: "pointer",
                }}
                title={"You"}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#ff6b6b",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px",
                    border: "2px solid white",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  Y
                </div>
              </div>

              {/* Connected Users */}
              {connectedUsers.map((user) => (
                <div
                  key={user.userId}
                  style={{
                    position: "relative",
                    cursor: "pointer",
                  }}
                  title={user.userName}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: user.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "14px",
                      border: "2px solid white",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            {/* Add Person Button */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="currentColor"
              className="bi bi-person-fill-add"
              viewBox="0 0 16 16"
              onClick={() => setShowJoin(true)}
              style={{
                cursor: "pointer",
                color: "white",
              }}
            >
              <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M2 13c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4Z" />
            </svg>
          </Col>
        </Row>
        <Row className="workspace-main" style={{ flex: 1, minHeight: "0" }}>
          <Col
            xs={12}
            md={7}
            lg={8}
            className="workspace-col"
            style={{
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CollaborativeEditor
              roomId={roomid || ""}
              userId={configStore?.getSecret() || "anonymous"}
              userName={users.length > 0 ? users[0].name : "Current User"}
              onSave={handleCollaborativeSave}
              onTitleChange={handleTitleChange}
              initialContent={doc}
              initialTitle={title}
              onSocketReady={handleSocketReady}
              onConnectedUsersChange={handleConnectedUsersChange}
            />
          </Col>
          <Col
            xs={12}
            md={5}
            lg={4}
            style={{
              minHeight: "400px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <MemoizedChatComponent
              users={users}
              roomid={roomid || ""}
              socket={sharedSocket}
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default Workspace;
