import React from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const Admin = ({ signOut, user}) => {
  return (
    <>
    <Navbar signOut={signOut} user={user} />
    <Sidebar/>
    <div
          style={{
            flex: 1,
            marginLeft: "220px",
            padding: "30px",
            backgroundColor: "#f4f4f4",
            minHeight: "90vh",
          }}
        >
          <h1>Admin Dashboard</h1>
    </div>
    </>
  )
}

export default Admin