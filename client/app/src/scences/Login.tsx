import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  let navigator = useNavigate();
  const [cred, setCred] = useState({ email: "", password: "" });
  const ipcRendener = (window as any).ipcRenderer;
  const configStore = (window as any).configStore;
  const host = "http://localhost:5000";
useEffect(() => {
  if(configStore.getSecret())
    navigator("/");
},)

  const handleClick = async () => {
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
      navigator("/");
      //show alert
    }
    else{
      //show error
    }
  };

  const handleChange = (e: any) => {
    if (e.target.name === "email") {
      setCred({ email: e.target.value, password: cred.password });
    } else {
      setCred({ email: cred.email, password: e.target.value });
    }
  };
  return (
    <div>
      <h1>Login Page</h1>
      <a href="/">Workspace</a>
      <a href="/signup">SignUp</a>
      <label>Email</label>
      <input name="email" type="email" required onChange={handleChange} />
      <label>Password</label>
      <input type="text" name="password" required onChange={handleChange} />
      <button type="button" onClick={handleClick}>
        Login
      </button>
    </div>
  );
};

export default Login;
