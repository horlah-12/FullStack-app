import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist.</p>
      <p>
        <Link to="/login">Go to Login</Link>
      </p>
    </div>
  );
}

