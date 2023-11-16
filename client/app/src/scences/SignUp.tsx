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
  name: string;
  email: string;
  password: string;
}

const SignUp: React.FC = () => {
  let navigator = useNavigate();
  useEffect(() => {
    if (configStore.getSecret()) navigator("/");
  });
  const ipcRendener = (window as any).ipcRenderer;
  const configStore = (window as any).configStore;
  const [cred, setCred] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<ValidationErrors>({ name: "", email: "", password: "" });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const host = "https://docusync-server.onrender.com";
  
  // Validation functions
  const validateName = (name: string): string => {
    if (!name.trim()) {
      return "Name is required";
    }
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
      return "Name can only contain letters and spaces";
    }
    return "";
  };

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
    const nameError = validateName(cred.name);
    const emailError = validateEmail(cred.email);
    const passwordError = validatePassword(cred.password);
    
    setErrors({
      name: nameError,
      email: emailError,
      password: passwordError
    });
    
    setTouched({ name: true, email: true, password: true });
    
    return !nameError && !emailError && !passwordError;
  };

  const handleClick = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }
    try {
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
        toast.success("Account created successfully! Welcome to DocSync!");
        navigator("/");
      } else {
        toast.error(json.msg || json.err || "Sign up failed. Please try again.");
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
      if (name === "name") {
        error = validateName(value);
      } else if (name === "email") {
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
    if (name === "name") {
      error = validateName(value);
    } else if (name === "email") {
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
                <div style={{ width: "70%" }}>
                  <FloatingLabel
                    controlId="floatingName"
                    label="Name"
                    style={{
                      color: "white",
                      backgroundColor: "#213555",
                    }}
                  >
                    <Form.Control
                      type="text"
                      name="name"
                      required
                      placeholder="Enter your full name"
                      value={cred.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      isInvalid={touched.name && !!errors.name}
                      style={{ 
                        backgroundColor: "#213555", 
                        color: "white",
                        borderColor: touched.name && errors.name ? "#dc3545" : "#213555"
                      }}
                    />
                  </FloatingLabel>
                  {touched.name && errors.name && (
                    <Alert variant="danger" style={{ 
                      marginTop: "5px", 
                      padding: "5px 10px", 
                      fontSize: "0.875rem",
                      backgroundColor: "rgba(220, 53, 69, 0.1)",
                      border: "1px solid #dc3545",
                      color: "#dc3545"
                    }}>
                      {errors.name}
                    </Alert>
                  )}
                </div>
                <div style={{ width: "70%" }}>
                  <FloatingLabel
                    controlId="floatingEmail"
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
                      placeholder="Enter a strong password"
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
