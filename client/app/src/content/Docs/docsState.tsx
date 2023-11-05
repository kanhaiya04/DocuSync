import React, { ReactNode, useCallback, useState } from "react";
import toast from "react-hot-toast";
import DocsContent from "./docsContent";

// Constants
const HOST = "https://docusync-server.onrender.com";

// Types
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

interface ConfigStore {
  getSecret(): string;
}

interface ApiResponse {
  success: boolean;
  response?: Doc[];
  msg?: string;
  err?: string;
}

interface CreateDocResponse {
  success: boolean;
  response?: Doc;
  msg?: string;
  err?: string;
}

const DocsState: React.FC<DocsStateProps> = ({ children }) => {
  const configStore = (window as any).configStore as ConfigStore;
  const [docs, setDocs] = useState<Doc[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const addDoc = useCallback(async (title: string, roomId: string) => {
    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    if (!roomId.trim()) {
      toast.error("Invalid room ID");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/doc/createdoc`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          token: configStore.getSecret(),
        },
        body: JSON.stringify({ title: title.trim(), roomId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const doc: CreateDocResponse = await response.json();

      if (doc.success && doc.response) {
        setDocs(prev => [...prev, doc.response!]);
        toast.success("Document created successfully!");
      } else {
        toast.error(doc.msg || doc.err || "Failed to create document. Please try again.");
      }
    } catch (error) {
      console.error("Create doc error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [configStore]);

  const emptyDoc = useCallback(() => {
    setDocs([]);
  }, []);
  const getDoc = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/doc/getalldoc`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
          token: configStore.getSecret(),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const doc: ApiResponse = await response.json();
      if (doc.success && doc.response) {
        setDocs(doc.response);
      } else {
        toast.error(doc.msg || doc.err || "Failed to load documents. Please try again.");
      }
    } catch (error) {
      console.error("Get docs error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [configStore]);

  const deleteDoc = useCallback(async (id: string) => {
    if (!id.trim()) {
      toast.error("Invalid document ID");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${HOST}/doc/deletedoc`, {
        method: "DELETE",
        headers: {
          "content-type": "application/json",
          token: configStore.getSecret(),
        },
        body: JSON.stringify({ _id: id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: ApiResponse = await response.json();

      if (json.success) {
        setDocs(prev => prev.filter(doc => doc._id !== id));
        toast.success("Document deleted successfully!");
      } else {
        toast.error(json.msg || json.err || "Failed to delete document. Please try again.");
      }
    } catch (error) {
      console.error("Delete doc error:", error);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [configStore]);
  return (
    <DocsContent.Provider value={{ 
      docs, 
      emptyDoc, 
      addDoc, 
      getDoc, 
      deleteDoc
    }}>
      {children}
    </DocsContent.Provider>
  );
};

export default DocsState;
