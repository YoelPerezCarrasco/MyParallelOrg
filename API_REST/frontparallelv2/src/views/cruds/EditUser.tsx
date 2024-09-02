import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EditUser: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:8000/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username);
        setEmail(data.email);
      } else {
        console.error('Failed to fetch user');
      }
    };

    fetchUser();
  }, [id]);

  const handleUpdateUser = async () => {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:8000/users/${id}`, {
      method: 'PUT',  // O PATCH si solo actualizas algunos campos
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,  // Incluye el token de autenticación
      },
      body: JSON.stringify({
        username,
        email,
      }),
    });

    if (response.ok) {
      console.log('User updated successfully');
      // Redireccionar o actualizar la lista de usuarios
    } else {
      const errorData = await response.json();
      setError(errorData.detail || 'Failed to update user');
    }
  };

  return (
    <div>
      <h2>Edit User</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleUpdateUser}>Update</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default EditUser;
