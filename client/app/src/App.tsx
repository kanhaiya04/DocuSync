import { Route, Routes } from "react-router-dom";
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
      </header>
    </div>
  );
}

export default App;
