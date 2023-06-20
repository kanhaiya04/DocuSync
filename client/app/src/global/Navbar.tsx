import React from "react";
import { Outlet } from "react-router-dom";

const Navbar: React.FC = () => {
  
  return (
    <div>
      Navbar
      <a href="/workspace">Workspace</a>
      <Outlet />
    </div>
  );
};

export default Navbar;
