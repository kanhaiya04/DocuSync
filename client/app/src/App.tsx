import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "./App.css";
import Workspace from "./scences/Workspace";
import Login from "./scences/Login";
import SignUp from "./scences/SignUp";
import Home from "./scences/Home";
import DocsState from "./content/Docs/docsState";
import UserState from "./content/Users/userState";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <DocsState>
          <UserState>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/" element={<Home />} />
              <Route path="/workspace/:roomid" element={<Workspace />} />
            </Routes>
          </UserState>
        </DocsState>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4aed88',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ff6b6b',
                secondary: '#fff',
              },
            },
          }}
        />
      </header>
    </div>
  );
}

export default App;
