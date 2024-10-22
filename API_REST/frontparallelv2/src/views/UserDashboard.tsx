import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ConnectedUser {
    username: string;
    avatar_url: string;
    github_url: string;
}

const UserDashboard: React.FC = () => {
    const [connections, setConnections] = useState<ConnectedUser[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConnections = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/users/user/connections', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await response.json();

                if (response.ok) {
                    if (Array.isArray(data)) {
                        setConnections(data);
                    } else {
                        setMessage(data.message);
                    }
                } else {
                    setMessage('Failed to fetch connections');
                }
            } catch (error) {
                console.error('Error fetching connections:', error);
                setMessage('An error occurred while fetching connections');
            }
        };

        fetchConnections();
    }, [navigate]);

    return (
        <div className="container mt-5">
            <h2 className="display-4 mb-4 text-center">Tus Conexion en la Empresa</h2>
            {message ? (
                <p className="text-center text-muted">{message}</p>
            ) : connections.length > 0 ? (
                <div className="row">
                    {connections.map((user, index) => (
                        <div key={index} className="col-md-4 mb-4">
                            <div className="card shadow-sm">
                                <div className="card-body text-center">
                                    <img 
                                        src={user.avatar_url} 
                                        alt={user.username} 
                                        className="rounded-circle mb-3" 
                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                    />
                                    <h5 className="card-title">{user.username}</h5>
                                    <a 
                                        href={user.github_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-primary mt-2"
                                    >
                                        View Profile
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center">No connections found.</p>
            )}
        </div>
    );
};

export default UserDashboard;
