
import { useState } from "react";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";

function App() {
  const [auth, setAuth] = useState(() => {
    const token = sessionStorage.getItem("talentai_token");
    const savedUser = sessionStorage.getItem("talentai_user");

    if (!token || !savedUser) return null;

    try {
      const user = JSON.parse(savedUser);

      if (!user || typeof user !== "object") {
        throw new Error("Invalid saved user");
      }

      return { token, user };
    } catch {
      sessionStorage.removeItem("talentai_token");
      sessionStorage.removeItem("talentai_user");
      return null;
    }
  });

  const handleLogin = (tokenOrAuth, user) => {
    // Supports both onLogin(token, user) and onLogin({token, user}).
    const loginData =
      typeof tokenOrAuth === "object" && tokenOrAuth !== null
        ? tokenOrAuth
        : { token: tokenOrAuth, user };

    if (!loginData.token || !loginData.user) {
      console.error("Invalid login response:", loginData);
      return;
    }

    sessionStorage.setItem("talentai_token", loginData.token);
    sessionStorage.setItem(
      "talentai_user",
      JSON.stringify(loginData.user)
    );

    setAuth(loginData);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("talentai_token");
    sessionStorage.removeItem("talentai_user");
    setAuth(null);
  };

  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  // Incomplete accounts must finish setup through Login.jsx.
  if (!auth.user?.setup_completed) {
    return (
      <Login
        onLogin={handleLogin}
        initialSetupToken={auth.token}
      />
    );
  }

  return (
    <Dashboard
      user={auth.user}
      token={auth.token}
      onLogout={handleLogout}
    />
  );
}

export default App;
