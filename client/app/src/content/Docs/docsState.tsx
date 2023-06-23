import React, { ReactNode, useState } from "react";
import DocsContent from "./docsContent";
const host = "http://localhost:5000";
interface DocsStateProps {
  children: ReactNode;
}

interface Doc {
  user: string;
  title: string;
  content: string;
  _id: string;
  date: string;
  __v: number;
}

const DocsState: React.FC<DocsStateProps> = ({ children }) => {
  const configStore = (window as any).configStore;
  const [docs, setDocs] = useState<Doc[]>([]);

  const addDoc = async (title: string, roomId: string) => {
    const response = await fetch(`${host}/doc/createdoc`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        token: configStore.getSecret(),
      },
      body: JSON.stringify({ title, roomId }),
    });
    const doc = await response.json();

    setDocs(docs.concat(doc));
  };

  const getDoc = async () => {
    const response = await fetch(`${host}/doc/getalldoc`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        token: configStore.getSecret(),
      },
    });
    const doc = await response.json();
    if (JSON.stringify(doc.response) !== JSON.stringify(docs))
      setDocs(doc.response);
  };

  return (
    <DocsContent.Provider value={{ docs, addDoc, getDoc }}>
      {children}
    </DocsContent.Provider>
  );
};

export default DocsState;
