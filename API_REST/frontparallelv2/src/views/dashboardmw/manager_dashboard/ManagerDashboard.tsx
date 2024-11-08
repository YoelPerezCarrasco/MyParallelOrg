// ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box, Paper, Divider } from '@mui/material';
import GroupPanel from './groups/GroupPanel';

interface GitHubUser {
    id: number;
    username: string;
    html_url: string;
    avatar_url: string;
    organization: string;
    stars: number;
    dominant_language: string;
    commits: number;
    contributions: number;
    pullRequests: number;
    reviews: number;
}

interface GrupoTrabajo {
    grupo_id: number;
    usuarios: number[]; // IDs de los usuarios
    leader_id: number | null; // Agrega leader_id a la interfaz
}

const ManagerDashboard: React.FC = () => {
    const [users, setUsers] = useState<GitHubUser[]>([]);
    const [userOrganization, setUserOrganization] = useState<string | null>(null);
    const [grupos, setGrupos] = useState<GrupoTrabajo[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Estado para el indicador de carga
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true); // Inicia la carga
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                // Obtener detalles de los usuarios con el nuevo endpoint
                const responseUsers = await fetch('http://localhost:8000/users/manager/users/details', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (responseUsers.ok) {
                    const dataUsers: GitHubUser[] = await responseUsers.json();
                    setUsers(dataUsers);

                    // Asumiendo que todos los usuarios son de la misma organización, extraemos de cualquiera de ellos
                    if (dataUsers.length > 0) {
                        setUserOrganization(dataUsers[0].organization);
                    }
                } else {
                    alert('No se pudieron obtener los detalles de los usuarios');
                }

                // Obtener grupos formados
                const responseGrupos = await fetch('http://localhost:8000/workgroups/manager/groups', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (responseGrupos.ok) {
                    const dataGrupos: GrupoTrabajo[] = await responseGrupos.json();
                    setGrupos(dataGrupos);
                } else {
                    alert('No se pudieron obtener los grupos');
                }

            } catch (error) {
                console.error('Error obteniendo datos:', error);
                alert('Ocurrió un error al obtener los datos');
            } finally {
                setIsLoading(false); // Finaliza la carga
            }
        };

        fetchData();
    }, [navigate]);

    return (
        <Container>
            <Paper elevation={8} style={{ padding: '50px', backgroundColor: '#f9f9f9' }}>
                <Typography variant="h3" align="center" gutterBottom color="primary">
                    Dashboard de Grupos de Trabajo
                </Typography>
                <Divider variant="middle" style={{ margin: '20px 0' }} />
                {userOrganization && (
                    <Typography variant="h6" align="center" color="textSecondary">
                        Organización: <strong>{userOrganization}</strong>
                    </Typography>
                )}
            </Paper>

            {isLoading ? (
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    height="50vh"
                    bgcolor="#f0f0f0"
                    borderRadius="8px"
                    mt={4}
                >
                    <CircularProgress color="secondary" size={50} />
                    <Typography variant="h5" marginTop={2}>
                        Cargando datos...
                    </Typography>
                </Box>
            ) : grupos.length > 0 ? (
                <Box mt={4}>
                    {grupos.map(grupo => (
                        <Box key={grupo.grupo_id} mb={3}>
                            <GroupPanel
                                groupId={grupo.grupo_id}
                                userIds={grupo.usuarios}
                                users={users}
                                leaderId={grupo.leader_id}
                            />
                        </Box>
                    ))}
                </Box>
            ) : (
                <Box mt={4} textAlign="center">
                    <Typography variant="body1" align="center" color="textSecondary">
                        No hay grupos formados aún.
                    </Typography>
                </Box>
            )}
        </Container>
    );
};

export default ManagerDashboard;
