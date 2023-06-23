import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
const host = "http://localhost:5000";
const socket = io(host);

const Workspace: React.FC = () => {
  const [Doc, setDoc] = useState("");
  const { roomid } = useParams();
  const configStore = (window as any).configStore;

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
    if (json.success) {
    }
  };

  const getDoc =async()=>{
    const response = await fetch(`${host}/doc/getdoc`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ id: roomid }),
    });
    const json = await response.json();
    setDoc(json.response.content);
  }

  useMemo(getDoc,[roomid]);
  useEffect(() => {
    socket.on("updatedDoc", (payload) => {
      setDoc(payload.data);
    });
    socket.emit("join-room", roomid);
  });

  return (
    <div>
      <h1>Workspace</h1>
      <a href="/login">login</a>
      <a href="/signup">SignUp</a>
      <h1>{roomid}</h1>
      <textarea name="doc" onChange={handleChange} value={Doc} />
      <button type="button" onClick={onSave}>
        Save
      </button>
    </div>
  );
};

export default Workspace;
