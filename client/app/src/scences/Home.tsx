import React, { useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import DocsContent from "../content/Docs/docsContent";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Col,
  Container,
  FloatingLabel,
  Form,
  Modal,
  Row,
} from "react-bootstrap";
import NavBar from "../global/Navbar";
import DocsCard from "../components/DocsCard";

const Home = () => {
  let navigator = useNavigate();
  const [title, setTitle] = useState("");
  const { docs, addDoc, getDoc } = useContext(DocsContent);

  const configStore = (window as any).configStore;
  useEffect(() => {
    if (configStore.getSecret()) {
      getDoc();
    } else {
      navigator("/login");
    }
  });

  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleChange = (e: any) => {
    setTitle(e.target.value);
  };

  const createNewDoc = () => {
    const roomId = nanoid(4);
    addDoc(title, roomId);
    setShow(false);
  };

  return (
    <Container
      fluid
      className="p-0 vh-100"
      style={{ backgroundColor: "#213555", color: "white" }}
    >
      <NavBar title="Home" />
      <>
        <Modal show={show} onHide={handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Create New Doc</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <FloatingLabel controlId="floatingInput" label="Title">
              <Form.Control
                type="text"
                name="title"
                required
                onChange={handleChange}
              />
            </FloatingLabel>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={createNewDoc}>
              Create
            </Button>
          </Modal.Footer>
        </Modal>
      </>

      <Container className="pt-4 main-container">
        <Row className="pt-2">
          <Col>
            <h1>Your Docs</h1>
          </Col>
          <Col xs="auto">
            <div className="d-flex align-items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                fill="currentColor"
                className="bi bi-plus-circle-fill"
                viewBox="0 0 16 16"
                onClick={handleShow}
                style={{ cursor: "pointer" }}
              >
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z" />
              </svg>
            </div>
          </Col>
        </Row>

        <Row className="doc-card" style={{ overflowY: "auto" }}>
          {docs.map((doc, index) => {
            let content;
            if(!doc.content) {
              content = "No content";
            }
            else if (doc.content.length>145) {
              content = doc.content.substring(0, 145) + "...";
            } 
            else{
              content= doc.content;
            }
            return (
              <DocsCard
                key={index}
                title={doc.title}
                content={content}
                url={doc._id}
              />
            );
          })}
        </Row>
      </Container>
    </Container>
  );
};

export default Home;
