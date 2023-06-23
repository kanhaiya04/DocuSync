import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {io} from "socket.io-client"

const socket = io("http://localhost:5000");

const Workspace: React.FC = () => {
  
  const [Doc, setDoc] = useState("");
  const roomid="hello hai";

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDoc(e.target.value);
    socket.emit("updateDoc",{data:e.target.value},roomid);
    console.log(Doc);
  };
useEffect(()=>{
  socket.on("updatedDoc", (payload)=>{
    console.log(payload.data);
    setDoc(payload.data);
  });
  socket.emit("join-room",roomid);
}
)
const {title}=useParams();
  return (
    <div>
      <h1>Workspace</h1>
      <a href="/login">login</a>
      <a href="/signup">SignUp</a>
      <h1>{title}</h1>
      <textarea name="doc" onChange={handleChange}  value={Doc}/>
      <button type="button">Save</button>
    </div>
  );
};

export default Workspace;
