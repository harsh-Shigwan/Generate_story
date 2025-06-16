import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Admin from "./pages/Admin";
import FacilitatorPage from "./pages/FacilitatorPage";
import StoryCreate from "./pages/StoryCreate";

function App() {
  const location = useLocation();

  return (
    <Authenticator>
      {({ signOut, user }) => {
        const groups = user?.signInUserSession?.idToken?.payload["cognito:groups"] || [];
        console.log("User groups:", groups);
        if (location.pathname === "/") {
          if (groups.includes("Admin")) return <Navigate to="/admin" replace />;
          if (groups.includes("Facilitator")) return <Navigate to="/facilitator" replace />;
        }
        return (
          <Routes>
            {groups.includes("Admin") && (
              <>
              <Route path="/admin" element={<Admin signOut={signOut} user={user} />} />
              <Route path="/create-story" element={<StoryCreate signOut={signOut} user={user} />}/>
              </>
            )}
            {groups.includes("Facilitator") && (
              <Route path="/facilitator" element={<FacilitatorPage signOut={signOut} user={user} />} />
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        );
      }}
    </Authenticator>
  );
}

export default App;
