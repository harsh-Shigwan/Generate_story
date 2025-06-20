// pages/Admin.jsx
import React, { useState } from 'react';
import Layout from '../components/Layout';

const Admin = ({ signOut, user }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Layout 
      signOut={signOut} 
      user={user}
      sidebarOpen={sidebarOpen}
      toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      <h1>Admin Dashboard</h1>
      {/* Your admin page content */}
    </Layout>
  );
};
export default Admin;