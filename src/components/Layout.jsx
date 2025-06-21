// components/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children, signOut, user, sidebarOpen, toggleSidebar }) => {
  return (
    <>
      <Navbar 
        signOut={signOut} 
        user={user} 
        isSidebarOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />
      <Sidebar isOpen={sidebarOpen} />
      <div
        className="main-content"
        style={{
          marginLeft: sidebarOpen ? "240px" : "60px",
          padding: "3px",
          minHeight: "80vh",
          transition: "margin-left 0.3s ease"
        }}
      >
        {children}
      </div>
    </>
  );
};

export default Layout;