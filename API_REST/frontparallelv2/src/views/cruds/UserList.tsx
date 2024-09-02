import React, { useEffect, useState } from 'react';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8000/users', {
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

  return (
    <div>
      <h2>User List</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
