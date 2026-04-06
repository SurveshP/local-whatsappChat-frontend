import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import LoginPage from './components/LoginPage';
import QRScanner from './components/QRScanner';
import ChatPage from './components/ChatPage';
import io from 'socket.io-client';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showQR, setShowQR] = useState(true);
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [username, setUsername] = useState('');
  const socketRef = useRef(null);

  // Initialize socket
  useEffect(() => {
    socketRef.current = io('https://local-whatsappchat-backend.onrender.com', {
      transports: ['websocket'], // only websocket
      reconnection: true,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
    });

    socketRef.current.on('whatsapp_connected', (data) => {
      console.log('WhatsApp connection event:', data);
      if (data.status) {
        setIsWhatsAppConnected(true);
        setShowQR(false);
        // Auto open chat after 2 seconds
        setTimeout(() => {
          setShowChat(true);
        }, 2000);
      }
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const handleLogin = (email, password) => {
    if (email === 'admin@example.com' && password === 'admin123') {
      setIsLoggedIn(true);
      setUsername(email.split('@')[0]);
    } else {
      alert('Invalid! Use: admin@example.com / admin123');
    }
  };

  return (
    <div>
      {!isLoggedIn && <LoginPage onLogin={handleLogin} />}

      {isLoggedIn && showQR && !isWhatsAppConnected && (
        <QRScanner socket={socketRef.current} />
      )}

      {isLoggedIn && isWhatsAppConnected && !showChat && (
        <div className="container text-center mt-5">
          <div className="card shadow mx-auto" style={{ maxWidth: '500px' }}>
            <div className="card-body p-5">
              <h3 className="text-success">✓ WhatsApp Connected!</h3>
              <p className="mt-3">Your WhatsApp is now linked</p>
              <button
                className="btn btn-primary btn-lg mt-3"
                onClick={() => setShowChat(true)}
              >
                Open Chat →
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && socketRef.current && (
        <ChatPage username={username} socket={socketRef.current} isWhatsAppConnected={isWhatsAppConnected} />
      )}
    </div>
  );
}

export default App;