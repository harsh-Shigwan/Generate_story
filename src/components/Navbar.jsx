import React from 'react';
import './Navbar.css';
import logo from "../assets/logo.png";
import { NavLink } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';

const Navbar = ({ signOut, user, isSidebarOpen, toggleSidebar }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          {isSidebarOpen ? <FaBars /> : <FaBars />}
        </button>
        <NavLink to="/" className="navbar-logo-img">
          <img src={logo} alt="Logo" className="navbar-logo-img" />
        </NavLink>
      </div>

      <div className="navbar-right">
        <span className="user-email">Hi, {user?.attributes?.email}</span>
        <button onClick={signOut} className="signout-btn">SIGN OUT</button>
      </div>
    </nav>
  );
};

export default Navbar;