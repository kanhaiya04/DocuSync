import React, { useContext, useEffect, useState } from "react";
import { nanoid } from "nanoid";
import DocsContent from "../content/Docs/docsContent";
import { useNavigate } from "react-router-dom";

const Home = () => {
  let navigator = useNavigate();
  const ipcRendener = (window as any).ipcRenderer;
  const [title, setTitle] = useState("");
  const [roomId, setroomId] = useState("");
  const { docs, addDoc, getDoc } = useContext(DocsContent);
  const configStore = (window as any).configStore;
  useEffect(() => {
    if (configStore.getSecret()) {
      getDoc();
    } else {
      navigator("/login");
    }
  });

  const handleChange = (e: any) => {
    setTitle(e.target.value);
  };

  const createNewDoc = () => {
    const roomId = nanoid(4);
    addDoc(title, roomId);
    // navigator("/workspace")
  };

  const handleLogOut = () => {
    ipcRendener.send("key:set", {
      token: null,
    });
    navigator("/login");
  };

  const updateRoomId = (e: any) => {
    setroomId(e.target.value);
  };

  const handleRoomJoin = async() => {
      const response= await fetch("http://localhost:5000/user/join",{
        method:"POST",
        headers:{
          "content-type": "application/json",
          "token":configStore.getSecret(),
        },
        body: JSON.stringify({roomId}),
      })
      const json = await response.json();
      console.log(json.response);
  };
  return (
    <div>
      <div>
        <h4>Join a room</h4>
        <input type="text" name="roomId" onChange={updateRoomId} />
        <button onClick={handleRoomJoin}>Join</button>
      </div>
      <button onClick={handleLogOut}>LogOut</button>
      <label>Title</label>
      <input type="text" name="title" onChange={handleChange} />
      <button onClick={createNewDoc}>New Doc</button>
      <div className="my-3 row">
        <h2>Your docs</h2>
        <div className="container">
          {docs.length === 0 && "No docs to return"}
        </div>
        {docs.map((doc, index) => {
          return (
            <h3
              key={index}
              onClick={() => {
                navigator(`/workspace/${doc.title}`);
              }}
            >
              {doc.title}
            </h3>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
