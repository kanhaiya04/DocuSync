import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  let navigator = useNavigate();
  const ipcRendener = (window as any).ipcRenderer;
  const configStore = (window as any).configStore;
  const [cred, setCred] = useState({ name: "", email: "", password: "" });
  const host = "http://localhost:5000";

  useEffect(() => {
    if (configStore.getSecret()) navigator("/");
  });

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
      //alert
    } else {
      //alert
    }
  };

  const handleChange = (e: any) => {
    setCred((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  return (
    <div>
      <h1>SignUp</h1>
      <label>Name</label>
      <input type="text" name="name" required onChange={handleChange} />
      <label>Email</label>
      <input type="email" name="email" required onChange={handleChange} />
      <label>Password</label>
      <input type="text" name="password" required onChange={handleChange} />
      <button type="button" onClick={handleClick}>
        SignUp
      </button>
    </div>
  );
};

export default SignUp;
