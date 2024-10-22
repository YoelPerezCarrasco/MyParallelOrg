import React, { useEffect, useState } from 'react';
import { Table, Modal, Form } from 'react-bootstrap';

interface User {
  id: number;
  username: string;
  rol: string;
  company: string;
  is_active: boolean;
  is_admin: boolean;
  is_manager: boolean;
}

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/users/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,  // Incluye el token de autenticación
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Failed to fetch users');
      }
    };

    fetchUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setEditUser(user);
    setShowEditModal(true);
  };

  const handleDeleteClick = async (id: number) => {
    if (!id) {
      console.error("User ID is undefined");
      return;
    }

    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:8000/users/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,  // Incluye el token de autenticación
      },
    });

    if (response.ok) {
      setUsers(users.filter(user => user.id !== id));
    } else {
      console.error('Failed to delete user');
    }
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem('token');

    if (editUser) {
      const response = await fetch(`http://localhost:8000/users/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUser),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
        setShowEditModal(false);
        setEditUser(null);
      } else {
        console.error('Failed to edit user');
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Lista de Usuarios del Sistema</h2>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Organización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.rol}</td>
              <td>{user.company}</td>
              <td>
                <button type="button" className="btn btn-warning me-2" onClick={() => handleEditClick(user)}>
                  <i className="bi bi-pencil-square"></i> Editar
                </button>
                <button type="button" className="btn btn-danger" onClick={() => handleDeleteClick(user.id)}>
                  <i className="bi bi-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal para editar usuario */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editUser && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Usuario</Form.Label>
                <Form.Control
                  type="text"
                  value={editUser.username}
                  onChange={e => setEditUser({ ...editUser, username: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Control
                  type="text"
                  value={editUser.rol}
                  onChange={e => setEditUser({ ...editUser, rol: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Organización</Form.Label>
                <Form.Control
                  type="text"
                  value={editUser.company}
                  onChange={e => setEditUser({ ...editUser, company: e.target.value })}
                />
              </Form.Group>
              <button type="button" className="btn btn-success" onClick={handleEditSubmit}>
                Guardar Cambios
              </button>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserList;
