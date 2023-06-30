import React, { useEffect, useState } from "react";
import {
  Col,
  Container,
  FloatingLabel,
  Form,
  Row,
  Stack,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  let navigator = useNavigate();
  useEffect(() => {
    if (configStore.getSecret()) navigator("/");
  });
  const ipcRendener = (window as any).ipcRenderer;
  const configStore = (window as any).configStore;
  const [cred, setCred] = useState({ name: "", email: "", password: "" });
  const host = "http://localhost:5000";
  

  const handleClick = async () => {
    const response = await fetch(`${host}/user/createuser`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        name: cred.name,
        email: cred.email,
        password: cred.password,
      }),
    });
    const json = await response.json();
    if (json.success) {
      const token = json.token;
      ipcRendener.send("key:set", {
        token: token,
      });
      navigator("/");
    } else {
      ipcRendener.send("error",{
        "error":json.err,
        "msg":json.msg?json.msg:"" 
      })
    }
  };

  const handleChange = (e: any) => {
    setCred((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  return (
    <Container
      fluid
      className=" d-flex justify-content-center align-items-center vh-100"
      style={{ backgroundColor: "#213555", color: "white" }}
    >
      <div
        className=" d-flex justify-content-center align-items-center"
        style={{
          backgroundColor: "#0E2954",
          width: "60%",
          height: "60%",
          padding: "5px",
        }}
      >
        <Row>
          <Col
            style={{ textAlign: "left" }}
            sm={5}
            className="d-flex align-items-center"
          >
            <div>
              <h1 className="pb-2 main-heading">Sign Up</h1>
              <p className="details">SignUp to use the awesome tool</p>
            </div>
          </Col>
          <Col
            className=" d-flex align-items-center"
            sm={1}
            style={{ width: "1px" }}
          >
            <div className="vertical-line"></div>
          </Col>
          <Col sm={6} className="d-flex align-items-center">
            <div style={{ width: "100%" }}>
              <Stack gap={3} style={{ alignItems: "center" }}>
                <FloatingLabel
                  controlId="floatingInput"
                  label="Name"
                  style={{
                    color: "white",
                    width: "70%",
                    backgroundColor: "#213555",
                  }}
                >
                  <Form.Control
                    type="text"
                    name="name"
                    required
                    placeholder="Name"
                    onChange={handleChange}
                    style={{ backgroundColor: "#213555", color: "white" }}
                  />
                </FloatingLabel>
                <FloatingLabel
                  controlId="floatingInput"
                  label="Email address"
                  style={{
                    color: "white",
                    width: "70%",
                    backgroundColor: "#213555",
                  }}
                >
                  <Form.Control
                    type="email"
                    name="email"
                    required
                    placeholder="name@example.com"
                    onChange={handleChange}
                    style={{ backgroundColor: "#213555", color: "white" }}
                  />
                </FloatingLabel>

                <FloatingLabel
                  controlId="floatingInput"
                  label="Password"
                  style={{
                    color: "white",
                    width: "70%",
                    backgroundColor: "#213555",
                  }}
                >
                  <Form.Control
                    type="password"
                    name="password"
                    required
                    placeholder="name@example.com"
                    onChange={handleChange}
                    style={{ backgroundColor: "#213555", color: "white" }}
                  />
                </FloatingLabel>

                <button
                  type="button"
                  style={{ borderColor: "#213555", color: "white" }}
                  className="btn "
                  onClick={handleClick}
                >
                  SignUp
                </button>
                <button
                  type="button"
                  style={{ borderColor: "#213555", color: "white" }}
                  className="btn "
                  onClick={() => {
                    navigator("/login");
                  }}
                >
                  Login
                </button>
              </Stack>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default SignUp;
