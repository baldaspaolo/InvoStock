import React from "react";
import Navbar from "./NavBar";
import { Outlet } from "react-router-dom";

const Layout = () => {
  return (
    <div>
      <Navbar />{" "}
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
