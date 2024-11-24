import React, { useState, useEffect } from 'react';
import { Card, Form, Alert, ProgressBar } from 'react-bootstrap';
import { parseJwt } from './../utils/jwtDecode';

const Settings: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [serverStatus, setServerStatus] = useState<string>('Loading...');
  const [cpuUsage, setCpuUsage] = useState<number>(0);
  const [memoryUsage, setMemoryUsage] = useState<number>(0);
  const [diskUsage, setDiskUsage] = useState<number>(0);

  let username: string | null = null;

  const token = localStorage.getItem("authTokens");

  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      username = decoded.username;
    }
  }


  useEffect(() => {
    // Simulación de obtención de estadísticas del servidor
    setTimeout(() => {
      setServerStatus('Online');
      setCpuUsage(45); // Ejemplo de uso de CPU en %
      setMemoryUsage(70); // Ejemplo de uso de Memoria en %
      setDiskUsage(55); // Ejemplo de uso de Disco en %
    }, 1000);
  }, []);

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    try {
      const response = await fetch(`http://api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,  // Assuming token is stored in localStorage
        },
        body: JSON.stringify({
          username: username,
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setSuccess("Password changed successfully");
        setError(null);
      } else {
        const data = await response.json();
        setError(data.detail || "Failed to change password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Ajustes</h2>

      <div className="row">
        {/* Server Status */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Estado Servidor</Card.Title>
              <Card.Text>Estado: {serverStatus}</Card.Text>
            </Card.Body>
          </Card>
        </div>

        {/* CPU Usage */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Uso de CPU</Card.Title>
              <ProgressBar now={cpuUsage} label={`${cpuUsage}%`} />
            </Card.Body>
          </Card>
        </div>

        {/* Memory Usage */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Uso de Memoria</Card.Title>
              <ProgressBar variant="info" now={memoryUsage} label={`${memoryUsage}%`} />
            </Card.Body>
          </Card>
        </div>

        {/* Disk Usage */}
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Uso de Disco</Card.Title>
              <ProgressBar variant="warning" now={diskUsage} label={`${diskUsage}%`} />
            </Card.Body>
          </Card>
        </div>

        {/* Password Change */}
        <div className="col-md-8 mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Cambiar Contraseña</Card.Title>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handlePasswordChange}>
                <Form.Group className="mb-3" controlId="currentPassword">
                  <Form.Label>Contraseña Actual</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Introduce contraseña actual"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                  <Form.Label>Contraseña Nueva</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Introduce contraseña nueva"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="confirmPassword">
                  <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirmar nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <button
                className="btn btn-dark btn-lg btn-block"
                type="submit"
            >
                Cambiar Contraseña
            </button>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
