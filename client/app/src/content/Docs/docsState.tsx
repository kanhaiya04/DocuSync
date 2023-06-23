import React, { ReactNode, useState } from "react";
import DocsContent from "./docsContent";

interface DocsStateProps {
  children: ReactNode;
}

// interface Doc{
//   title:string,
//   roomId:string
// }
interface Doc {
  user: string;
  title: string;
  content:string;
  _id: string;
  date: string;
  __v: number;
}

const DocsState:React.FC<DocsStateProps> = ({ children }) => {
  const configStore = (window as any).configStore;
  //const host = "http://localhost:5000";
  const [docs, setDocs] = useState<Doc[]>([]);


  const addDoc =async(title:string,roomId:string)=>{
    const response = await fetch("http://localhost:5000/doc/createdoc",{
      method: "POST",
      headers:{
        "content-type": "application/json",
        "token": configStore.getSecret(),
      },
      body:JSON.stringify({title,roomId}),
    });
    const doc=await response.json();
    //   const data:Doc={
    //     title:title,
    //     roomId:roomId
    //   }
    setDocs(docs.concat(doc));
  }

  const getDoc = async () => {
    const response = await fetch("http://localhost:5000/doc/getdoc",{
      method: "GET",
      headers:{
        "content-type": "application/json",
        "token": configStore.getSecret(),
      }
    })
    const doc= await response.json();
    setDocs(doc.response);
  }


  return (
<DocsContent.Provider value={{ docs, addDoc , getDoc}}>
{children}
</DocsContent.Provider>
  )
};

export default DocsState;
