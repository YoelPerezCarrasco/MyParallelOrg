import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

interface ConnectedUser {
    username: string;
    avatar_url: string;
    github_url: string;
    probabilidad: number;
}

const UserDashboard: React.FC = () => {
    const [connections, setConnections] = useState<ConnectedUser[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [userId, setUserId] = useState<number | null>(null);
    const navigate = useNavigate();

    const fetchRecommendations = async (userId: number, token: string) => {
        try {
            const response = await fetch(`http://localhost:8000/prediction/users/${userId}/recommendations`, {
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
                setMessage('Failed to fetch recommendations');
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setMessage('An error occurred while fetching recommendations');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUserId = async () => {
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:8000/auth/users/me', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok && data.id) {  // Check if data contains 'id'
                    setUserId(data.id);
                } else {
                    setMessage("Error obteniendo el usuario.");
                }
            } catch (error) {
                console.error("Error fetching user ID:", error);
                setMessage("An error occurred while fetching user ID");
            }
        };
        

        fetchUserId();
    }, [navigate]);

    // Fetch recommendations when userId becomes available
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (userId !== null && token) {
            fetchRecommendations(userId, token);
        }
    }, [userId]);

    return (
        <div className="container mt-5">
            <h2 className="display-4 mb-4 text-center">Recomendaciones de Colaboración</h2>
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
                                    <p className="card-text">Probabilidad de colaboración: {(user.probabilidad * 100).toFixed(2)}%</p>
                                    <a 
                                        href={user.github_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-primary mt-2"
                                    >
                                        Ver Perfil
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center">No se encontraron recomendaciones.</p>
            )}
        </div>
    );
};

export default UserDashboard;
