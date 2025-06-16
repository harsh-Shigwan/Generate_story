import React from "react";
import { useAuth } from "react-oidc-context";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

const FacilitatorPage = ({ signOut, user }) => {

  return (
    <div> <Navbar signOut={signOut } user={user}/>
  <div style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: "220px", padding: "30px" }}>
        <h1>Facilitator Dashboard</h1>
        <p>Welcome {user?.attributes?.email}</p>
    
      </div>
    </div></div>
  );
};

export default FacilitatorPage;
