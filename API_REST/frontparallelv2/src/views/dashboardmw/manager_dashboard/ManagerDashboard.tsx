import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GitHubUser {
    id: number;
    username: string;
    html_url: string;
    avatar_url: string;
    organization: string;
    stars: number;
    dominant_language: string;
}

interface GrupoTrabajo {
    grupo_id: number;
    usuarios: number[]; // IDs de los usuarios
}

const ManagerDashboard: React.FC = () => {
    const [users, setUsers] = useState<GitHubUser[]>([]);
    const [userOrganization, setUserOrganization] = useState<string | null>(null);
    const [grupos, setGrupos] = useState<GrupoTrabajo[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Obtener usuarios
                const responseUsers = await fetch('http://localhost:8000/users/manager/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (responseUsers.ok) {
                    const dataUsers = await responseUsers.json();
                    setUsers(dataUsers);

                    // Asumiendo que todos los usuarios son de la misma organización
                    if (dataUsers.length > 0) {
                        setUserOrganization(dataUsers[0].organization);
                    }
                } else {
                    alert('Failed to fetch users');
                }

                // Obtener grupos formados
                const responseGrupos = await fetch('http://localhost:8000/workgroups/manager/groups', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (responseGrupos.ok) {
                    const dataGrupos = await responseGrupos.json();
                    setGrupos(dataGrupos);
                } else {
                    alert('Failed to fetch groups');
                }

            } catch (error) {
                console.error('Error fetching data:', error);
                alert('An error occurred while fetching data');
            }
        };

        fetchData();
    }, [navigate]);

    // Función para obtener información de usuario por ID
    const getUserById = (id: number) => {
        return users.find(user => user.id === id);
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4 text-primary">Grupos de Trabajo Formados</h2>
            {userOrganization && (
                <p className="text-center text-muted">Organización: <strong>{userOrganization}</strong></p>
            )}

            {grupos.length > 0 ? (
                <table className="table table-striped table-bordered">
                    <thead className="thead-dark">
                        <tr>
                            <th>Grupo ID</th>
                            <th>Miembros del Grupo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grupos.map(grupo => (
                            <tr key={grupo.grupo_id}>
                                <td>{grupo.grupo_id + 1}</td>
                                <td>
                                    {grupo.usuarios.map(userId => {
                                        const user = getUserById(userId);
                                        if (user) {
                                            return (
                                                <div key={user.id} className="d-inline-block mr-3 mb-2 text-center">
                                                    <img
                                                        src={user.avatar_url}
                                                        alt={user.username}
                                                        style={{ width: '50px', height: '50px', borderRadius: '50%' }}
                                                    />
                                                    <div>{user.username}</div>
                                                </div>
                                            );
                                        } else {
                                            return null;
                                        }
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="alert alert-info text-center">
                    No hay grupos formados aún.
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
