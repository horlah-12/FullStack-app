import { Link } from "react-router-dom";

export default function ForgotPassword() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Forgot password</h1>
      <p>This screen isn’t implemented yet.</p>
      <p>
        <Link to="/login">Back to Login</Link>
      </p>
    </div>
  );
}

