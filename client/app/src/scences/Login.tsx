import React, { useEffect, useState } from "react";
import {
  Col,
  Container,
  FloatingLabel,
  Form,
  Row,
  Stack,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

interface ValidationErrors {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  let navigator = useNavigate();
  const [cred, setCred] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({ email: "", password: "" });
  const [touched, setTouched] = useState({ email: false, password: false });
  const ipcRendener = (window as any).ipcRenderer;
  const configStore = (window as any).configStore;
  const host = "https://docusync-server.onrender.com";
  useEffect(() => {
    if (configStore.getSecret()) navigator("/");
  });

  // Validation functions
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (password: string): string => {
    if (!password.trim()) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return "";
  };

  const validateForm = (): boolean => {
    const emailError = validateEmail(cred.email);
    const passwordError = validatePassword(cred.password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });
    
    setTouched({ email: true, password: true });
    
    return !emailError && !passwordError;
  };

  const handleClick = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    try {
      const response = await fetch(`${host}/user/login`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email: cred.email, password: cred.password }),
      });
      const json = await response.json();
      if (json.success) {
        const token = json.token;
        ipcRendener.send("key:set", {
          token: token,
        });
        toast.success("Login successful! Welcome back!");
        navigator("/");
      } else {
        toast.error(json.msg || json.err || "Login failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error. Please check your connection and try again.");
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setCred(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    if (touched[name as keyof typeof touched]) {
      let error = "";
      if (name === "email") {
        error = validateEmail(value);
      } else if (name === "password") {
        error = validatePassword(value);
      }
      
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: any) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    let error = "";
    if (name === "email") {
      error = validateEmail(value);
    } else if (name === "password") {
      error = validatePassword(value);
    }
    
    setErrors(prev => ({ ...prev, [name]: error }));
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
              <h1 className="pb-2 main-heading">Login</h1>
              <p className="details">Login to collaborate with other folks</p>
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
                <div style={{ width: "70%" }}>
                  <FloatingLabel
                    controlId="floatingInput"
                    label="Email address"
                    style={{
                      color: "white",
                      backgroundColor: "#213555",
                    }}
                  >
                    <Form.Control
                      type="email"
                      name="email"
                      required
                      placeholder="name@example.com"
                      value={cred.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.email && !!errors.email}
                      style={{ 
                        backgroundColor: "#213555", 
                        color: "white",
                        borderColor: touched.email && errors.email ? "#dc3545" : "#213555"
                      }}
                    />
                  </FloatingLabel>
                  {touched.email && errors.email && (
                    <Alert variant="danger" style={{ 
                      marginTop: "5px", 
                      padding: "5px 10px", 
                      fontSize: "0.875rem",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                      border: "1px solid #dc3545",
                      color: "#dc3545"
                    }}>
                      {errors.email}
                    </Alert>
                  )}
                </div>

                <div style={{ width: "70%" }}>
                  <FloatingLabel
                    controlId="floatingPassword"
                    label="Password"
                    style={{
                      color: "white",
                      backgroundColor: "#213555",
                    }}
                  >
                    <Form.Control
                      type="password"
                      name="password"
                      required
                      placeholder="Enter your password"
                      value={cred.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.password && !!errors.password}
                      style={{ 
                        backgroundColor: "#213555", 
                        color: "white",
                        borderColor: touched.password && errors.password ? "#dc3545" : "#213555"
                      }}
                    />
                  </FloatingLabel>
                  {touched.password && errors.password && (
                    <Alert variant="danger" style={{ 
                      marginTop: "5px", 
                      padding: "5px 10px", 
                      fontSize: "0.875rem",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                      border: "1px solid #dc3545",
                      color: "#dc3545"
                    }}>
                      {errors.password}
                    </Alert>
                  )}
                </div>

                <button
                  type="button"
                  style={{ borderColor: "#213555", color: "white" }}
                  className="btn"
                  onClick={handleClick}
                >
                  Login
                </button>
                <button
                  type="button"
                  style={{ borderColor: "#213555", color: "white" }}
                  className="btn"
                  onClick={() => {
                    navigator("/signup");
                  }}
                >
                  SignUp
                </button>
              </Stack>
            </div>
          </Col>
        </Row>
      </div>
    </Container>
  );
};

export default Login;
