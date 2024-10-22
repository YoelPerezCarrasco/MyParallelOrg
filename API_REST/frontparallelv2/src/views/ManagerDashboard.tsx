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

const ManagerDashboard: React.FC = () => {
    const [users, setUsers] = useState<GitHubUser[]>([]);
    const [userOrganization, setUserOrganization] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUsers = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/users/manager/users', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);

                    // Asumiendo que todos los usuarios son de la misma organización, toma la organización del primer usuario
                    if (data.length > 0) {
                        setUserOrganization(data[0].organization);
                    }
                } else {
                    alert('Failed to fetch users');
                }
            } catch (error) {
                console.error('Error fetching users:', error);
                alert('An error occurred while fetching users');
            }
        };

        fetchUsers();
    }, [navigate]);

    const handleViewGraph = () => {
        if (userOrganization) {
            navigate(`/graphs/${userOrganization}`);
        }
    };

    const exportCSV = () => {
        const headers = ["ID", "Username", "GitHub URL", "Organization", "Stars", "Dominant Language"];
        const csvRows = [
            headers.join(','), // Encabezados
            ...users.map(user =>
                [
                    user.id,
                    user.username,
                    user.html_url,
                    user.organization,
                    user.stars,
                    user.dominant_language
                ].join(',')
            )
        ].join('\n');

        const blob = new Blob([csvRows], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `connections_${userOrganization}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Conexiones de Empleados</h2>

            {userOrganization && (
                <div className="text-center mb-4">
                    <button className="btn btn-info me-2" onClick={handleViewGraph}>
                        Ver Grupos De Trabajo
                    </button>
                    <button className="btn btn-success" onClick={exportCSV}>
                        Exportar CSV
                    </button>
                </div>
            )}

            <h3 className="text-center mb-5">Trabajadores de tu Empresa</h3>

            {users.length > 0 ? (
                <div className="row">
                    {users.map(user => (
                        <div key={user.id} className="col-md-4">
                            <div className="card mb-4 shadow-sm">
                                <img src={user.avatar_url} alt={user.username} className="card-img-top" style={{ borderRadius: '50%', width: '50%', margin: '20px auto' }} />
                                <div className="card-body text-center">
                                    <h5 className="card-title">{user.username}</h5>
                                    <p className="card-text">
                                        <strong>Lenguaje:</strong> {user.dominant_language} <br />
                                        <strong>Reputación GitHub (Stars):</strong> {user.stars}
                                    </p>
                                    <a href={user.html_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                        Ver Perfil de Github
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="alert alert-info text-center">
                    Tu empresa no está todavia en nuestra base de datos.
                    Comunicate con el administrador gestionar la inclusión.
                </div>
            )}
        </div>
    );
};

export default ManagerDashboard;
