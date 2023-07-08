import React, { useContext, useEffect, useMemo, useState } from "react";
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
import { io } from "socket.io-client";
import NavBar from "../global/Navbar";
import userContext from "../content/Users/usersContent";
import MemoizedChatComponent from "../components/Chat";
const host = "http://localhost:5000";
const socket = io(host);

const Workspace: React.FC = () => {
  const ipcRendener = (window as any).ipcRenderer;
  const [Doc, setDoc] = useState("");
  const [title, setTitle] = useState("");
  const { roomid } = useParams();
  const [email, setEmail] = useState("");
  const configStore = (window as any).configStore;
  const { users } = useContext(userContext);


  const [showJoin, setShowJoin] = useState(false);
  const handleJoinClose = () => setShowJoin(false);
  const handleJoinShow = () => setShowJoin(true);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDoc(e.target.value);
    socket.emit("updateDoc", { data: e.target.value }, roomid);
  };

  const onSave = async () => {
    const response = await fetch(`${host}/doc/updatedoc`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        token: configStore.getSecret(),
      },
      body: JSON.stringify({ _id: roomid, content: Doc }),
    });
    const json = await response.json();
    if (!json.success) {
      ipcRendener.send("error", {
        error: json.err,
        msg: json.msg ? json.msg : "",
      });
    }
  };

  const getDoc = async () => {
    const response = await fetch(`${host}/doc/getdoc`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ id: roomid }),
    });
    const json = await response.json();
    if (json.success) {
      setDoc(json.response.content);
      setTitle(json.response.title);
    } else {
      ipcRendener.send("error", {
        error: json.err,
        msg: json.msg ? json.msg : "",
      });
    }
  };
  

  
  useMemo(getDoc, [roomid, ipcRendener]);
  useEffect(() => {
    socket.on("updatedDoc", (payload) => {
      setDoc(payload.data);
    });
    

    socket.emit("join-room", roomid);
  });

  const updateEmail = (e: any) => {
    setEmail(e.target.value);
  };

  const handleRoomJoin = async () => {
    const response = await fetch(`${host}/user/join`, {
      method: "POST",
      headers: {
        token: configStore.getSecret(),
        "content-type": "application/json",
      },
      body: JSON.stringify({ email, roomId: roomid }),
    });
    const json = await response.json();
    if (!json.success) {
      ipcRendener.send("error", {
        error: json.err,
        msg: json.msg ? json.msg : "",
      });
    }
    handleJoinClose();
  };

 
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
            <Button variant="primary" onClick={handleRoomJoin}>
              Join
            </Button>
          </Modal.Footer>
        </Modal>
      </>
      <NavBar title="Workspace" />
      <Container className="pt-4 main-container">
        <Row className="pt-2">
          <Col>
            <h1>{title}</h1>
          </Col>
          <Col xs="auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="36"
              height="36"
              fill="currentColor"
              className="bi bi-person-fill-add"
              viewBox="0 0 16 16"
              onClick={handleJoinShow}
              style={{ cursor: "pointer" }}
            >
              <path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0Zm-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path d="M2 13c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4Z" />
            </svg>
          </Col>
        </Row>
        <Row className="pt-3 workspace-main">
          <Col xs={12} md={7} lg={8} className="workspace-col">
            <div style={{ height: "90%" }}>
              <textarea
                name="doc"
                onChange={handleChange}
                value={Doc}
                className="form-control"
                style={{ height: "100%" }}
              />
            </div>
            <div>
              <Row className="pt-2">
                <Col>
                  <Button
                    onClick={onSave}
                    style={{ backgroundColor: "#0E2954", border: "none" }}
                  >
                    Save
                  </Button>
                </Col>
              </Row>
            </div>
          </Col>
          <Col >
          
          <MemoizedChatComponent users={users} roomid={roomid}/>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default Workspace;
