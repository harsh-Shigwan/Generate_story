import React from "react";
import "./Sidebar.css";
import { FaUser, FaTools } from "react-icons/fa";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <ul className="sidebar-links">
        <li>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <FaUser className="icon" />
            <span>Users</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/create-story"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <FaTools className="icon" />
            <span>Features</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;