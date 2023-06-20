import React, { useEffect, useState } from "react";
import {io} from "socket.io-client"

const socket = io("http://localhost:5000");

const Workspace: React.FC = () => {
  const [Doc, setDoc] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDoc(e.target.value);
    socket.emit("updateDoc",{data:e.target.value});
    console.log(Doc);
  };
useEffect(()=>{
  socket.on("updatedDoc", (payload)=>{
    console.log(payload.data);
    setDoc(payload.data);
  })
})
  return (
    <div>
      <h1>Workspace</h1>
      <input type="text" name="doc" onChange={handleChange} value={Doc}/>
    </div>
  );
};

export default Workspace;
