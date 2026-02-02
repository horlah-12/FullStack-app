import React from "react";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Congratulations() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect back to tasks after 3 seconds
    const timer = setTimeout(() => {
      navigate("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      textAlign: 'center',
      backgroundColor: '#f0f8ff'
    }}>
      <h1 style={{ fontSize: '3em', color: '#28a745' }}>🎉 Task Successfully Saved! 🎉</h1>
      <p style={{ fontSize: '1.2em', color: '#666', marginTop: '20px' }}>
        Redirecting back to your tasks in 3 seconds.......
      </p>
      <Link 
        to="/" 
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '1.1em'
        }}
      >
        Return to Tasks
      </Link>
    </div>
  );
}




