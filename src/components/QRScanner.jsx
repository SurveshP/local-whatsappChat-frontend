import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

function QRScanner({ socket }) {
    const [qrCode, setQrCode] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!socket) return;

        console.log('QRScanner mounted');

        socket.on('qr_update', (qrDataURL) => {
            console.log('QR received in browser');
            setQrCode(qrDataURL);
            setLoading(false);
        });

        socket.on('connect_error', () => {
            setError('Cannot connect to backend. Make sure server is running on port 5000');
            setLoading(false);
        });

        // Request QR if socket is connected
        // if (socket.connected) {
        //   socket.emit('request_qr');
        // }
        socket.on('connect', () => {
            console.log('🔌 Connected, requesting QR...');
            socket.emit('request_qr');
        });

        return () => {
            socket.off('qr_update');
            socket.off('connect_error');
        };
    }, [socket]);

    return (
        <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
            <Row className="w-100">
                <Col md={6} lg={4} className="mx-auto">
                    <Card className="shadow-lg">
                        <Card.Body className="p-5 text-center">
                            <h3 className="mb-4">📱 Scan QR Code</h3>

                            {error && <Alert variant="danger">{error}</Alert>}

                            {loading && !qrCode && (
                                <div>
                                    <Spinner animation="border" variant="primary" />
                                    <p className="mt-3">Loading QR Code...</p>
                                </div>
                            )}

                            {qrCode && (
                                <>
                                    <div className="mb-4 p-3 border rounded bg-white">
                                        <img
                                            src={qrCode}
                                            alt="WhatsApp QR"
                                            style={{ width: '100%', maxWidth: '280px' }}
                                        />
                                    </div>

                                    <div className="text-start">
                                        <h6>How to connect:</h6>
                                        <ol className="small text-muted">
                                            <li>Open WhatsApp on your phone</li>
                                            <li>Tap Menu (⋮) or Settings</li>
                                            <li>Select "Linked Devices"</li>
                                            <li>Tap "Link a Device"</li>
                                            <li>Scan this QR code</li>
                                        </ol>
                                    </div>

                                    <div className="mt-3">
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        <span className="text-info">Waiting for scan...</span>
                                    </div>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default QRScanner;