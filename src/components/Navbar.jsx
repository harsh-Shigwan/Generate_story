import React from 'react';
import './Navbar.css';
import logo from "../assets/logo.png"
import { NavLink } from 'react-router-dom';
const Navbar = ({ signOut, user }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
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
