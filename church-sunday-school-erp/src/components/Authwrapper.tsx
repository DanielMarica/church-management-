import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

export default function AuthWrapper() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <>
      {showRegister ? (
        <Register onBackToLogin={() => setShowRegister(false)} />
      ) : (
        <Login onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </>
  );
}