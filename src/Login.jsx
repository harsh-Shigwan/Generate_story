import React, { useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    await auth.signinRedirect();
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      const groups = auth.user?.profile["cognito:groups"] || [];

      if (groups.includes("Admin")) {
        navigate("/admin");
      } else if (groups.includes("Facilitator")) {
        navigate("/facilitator");
      } else {
        navigate("/"); // no group or unknown group
      }
    }
  }, [auth.isAuthenticated, auth.user, navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Login Page</h2>
      <button onClick={handleLogin}>Sign In</button>
    </div>
  );
};

export default Login;
