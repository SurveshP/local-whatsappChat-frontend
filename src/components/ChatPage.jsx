import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Form, Button, InputGroup, Badge, Alert } from 'react-bootstrap';

function ChatPage({ username, socket, isWhatsAppConnected }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [activeTab, setActiveTab] = useState('local');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!socket) return;

        // Load local messages history
        socket.on('local_messages_history', (history) => {
            console.log('Loaded messages:', history.length);
            setMessages(history);
        });

        // New local message
        socket.on('new_local_message', (message) => {
            console.log('New local message:', message);
            setMessages(prev => [...prev, message]);
        });

        // New WhatsApp message received
        socket.on('new_whatsapp_message', (message) => {
            console.log('New WhatsApp message:', message);
            setMessages(prev => {
                const exists = prev.find(m =>
                    m.message === message.message &&
                    (m.from === message.from || m.to === message.to) &&
                    Math.abs(new Date(m.time) - new Date(message.time)) < 2000
                );

                if (exists) return prev; // duplicate skip

                return [...prev, message];
            });
            setSuccess(`New WhatsApp message from ${message.from}`);
            setTimeout(() => setSuccess(''), 3000);
        });

        // Message sent confirmation
        socket.on('message_sent', (data) => {
            if (data.success) {
                setMessages(prev => [...prev, data.message]);
                setSuccess('Message sent!');
                setTimeout(() => setSuccess(''), 2000);
            }
        });

        // Error handling
        socket.on('message_error', (err) => {
            setError(err);
            setTimeout(() => setError(''), 3000);
        });

        return () => {
            socket.off('local_messages_history');
            socket.off('new_local_message');
            socket.off('new_whatsapp_message');
            socket.off('message_sent');
            socket.off('message_error');
        };
    }, [socket]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (activeTab === 'local') {
            socket.emit('send_local_message', {
                username: username,
                message: newMessage
            });
            // Add to UI immediately
            const tempMessage = {
                id: Date.now(),
                type: 'local',
                username: username,
                message: newMessage,
                time: new Date()
            };
            setMessages(prev => [...prev, tempMessage]);
        }
        else if (activeTab === 'whatsapp') {
            if (!whatsappNumber) {
                setError('Please enter WhatsApp number');
                return;
            }
            if (!isWhatsAppConnected) {
                setError('WhatsApp not connected. Please scan QR first.');
                return;
            }

            socket.emit('send_whatsapp_message', {
                number: whatsappNumber,
                message: newMessage
            });
        }

        setNewMessage('');
    };

    return (
        <Container fluid className="vh-100 p-0">
            <Row className="h-100 g-0">
                <Col md={3} className="border-end bg-light">
                    <div className="p-3">
                        <h4 className="mb-4">Chat App</h4>

                        <div className="mb-4">
                            <h5>Chat Mode</h5>
                            <div className="btn-group w-100">
                                <Button
                                    variant={activeTab === 'local' ? 'primary' : 'outline-primary'}
                                    onClick={() => setActiveTab('local')}
                                >
                                    Local Chat
                                </Button>
                                <Button
                                    variant={activeTab === 'whatsapp' ? 'success' : 'outline-success'}
                                    onClick={() => setActiveTab('whatsapp')}
                                    disabled={!isWhatsAppConnected}
                                >
                                    WhatsApp
                                </Button>
                            </div>
                            {!isWhatsAppConnected && (
                                <small className="text-warning d-block mt-2">
                                    WhatsApp not connected
                                </small>
                            )}
                        </div>

                        {activeTab === 'whatsapp' && isWhatsAppConnected && (
                            <div className="mb-4">
                                <h5>WhatsApp Number</h5>
                                <Form.Control
                                    type="text"
                                    placeholder="e.g., 917566007436"
                                    value={whatsappNumber}
                                    onChange={(e) => setWhatsappNumber(e.target.value)}
                                />
                                <small className="text-muted">
                                    Include country code without '+'
                                </small>
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-top">
                            <div className="small text-muted">
                                <strong>Logged in as:</strong> {username}
                            </div>
                        </div>
                    </div>
                </Col>

                <Col md={9}>
                    <div className="d-flex flex-column h-100">
                        <div className={`p-3 text-white ${activeTab === 'local' ? 'bg-primary' : 'bg-success'}`}>
                            <h4 className="mb-0">
                                {activeTab === 'local' ? 'Local Chat' : 'WhatsApp Chat'}
                            </h4>
                        </div>

                        <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {success && <Alert variant="success">{success}</Alert>}

                            {messages.length === 0 ? (
                                <div className="text-center text-muted mt-5">
                                    <p>No messages yet</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`mb-3 ${msg.username === username || msg.isSent ? 'text-end' : 'text-start'}`}>
                                        <div className={`d-inline-block p-3 rounded ${msg.username === username || msg.isSent ? 'bg-primary text-white' : 'bg-light'}`} style={{ maxWidth: '70%' }}>
                                            {msg.type === 'local' && msg.username !== username && (
                                                <small className="d-block fw-bold mb-1">{msg.username}</small>
                                            )}
                                            {msg.type === 'whatsapp' && msg.isReceived && (
                                                <small className="d-block fw-bold mb-1 text-info">From: {msg.from}</small>
                                            )}
                                            {msg.type === 'whatsapp' && msg.isSent && (
                                                <small className="d-block fw-bold mb-1">To: {msg.to}</small>
                                            )}
                                            <div>{msg.message}</div>
                                            <small className="opacity-75">
                                                {new Date(msg.time).toLocaleTimeString()}
                                            </small>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="border-top p-3 bg-light">
                            <Form onSubmit={handleSendMessage}>
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder={
                                            activeTab === 'local'
                                                ? "Type local message..."
                                                : "Type WhatsApp message..."
                                        }
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                    />
                                    <Button type="submit" variant={activeTab === 'local' ? 'primary' : 'success'}>
                                        Send
                                    </Button>
                                </InputGroup>
                            </Form>
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default ChatPage;