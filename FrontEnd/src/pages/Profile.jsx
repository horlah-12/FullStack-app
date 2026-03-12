import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../components/AuthContext.jsx";

export default function Profile() {
  const { user } = useContext(AuthContext);

  return (
    <div style={{ padding: 24 }}>
      <h1>Profile</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(user, null, 2)}</pre>
      <p>
        <Link to="/tasks">Back to Tasks</Link>
      </p>
    </div>
  );
}

