import React from 'react';

const DeleteUser: React.FC<{ id: string, onDelete: () => void }> = ({ id, onDelete }) => {
  const handleDelete = async () => {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:8000/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,  // Incluye el token de autenticación
      },
    });

    if (response.ok) {
      console.log('User deleted successfully');
      onDelete();  // Callback para actualizar la lista de usuarios
    } else {
      console.error('Failed to delete user');
    }
  };

  return (
    <button onClick={handleDelete}>Delete User</button>
  );
};

export default DeleteUser;
