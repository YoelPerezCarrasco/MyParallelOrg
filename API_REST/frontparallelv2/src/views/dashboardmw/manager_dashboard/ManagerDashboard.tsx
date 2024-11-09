// ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box, Paper, Divider, Grid } from '@mui/material';
import GroupPanel from './groups/GroupPanel';
import SearchBar from './SearchBar';
import OpenProjects from './OpenProjects'; // Importa el nuevo componente

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
    usuarios: number[];
    leader_id: number | null;
}

const ManagerDashboard: React.FC = () => {
    const [users, setUsers] = useState<GitHubUser[]>([]);
    const [userOrganization, setUserOrganization] = useState<string | null>(null);
    const [grupos, setGrupos] = useState<GrupoTrabajo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroup, setExpandedGroup] = useState<number | false>(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const responseUsers = await fetch('http://localhost:8000/users/manager/users/details', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (responseUsers.ok) {
                    const dataUsers: GitHubUser[] = await responseUsers.json();
                    setUsers(dataUsers);
                    if (dataUsers.length > 0) {
                        setUserOrganization(dataUsers[0].organization);
                    }
                } else {
                    alert('No se pudieron obtener los detalles de los usuarios');
                }

                const responseGrupos = await fetch('http://localhost:8000/workgroups/manager/groups', {
                    headers: { Authorization: `Bearer ${token}` }
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
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const filteredGroups = searchTerm
        ? grupos.filter(group =>
            group.usuarios.some(userId => 
                users.find(user => user.id === userId && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        )
        : grupos;

    const handleToggleExpand = (groupId: number) => {
        setExpandedGroup(prevExpanded => (prevExpanded === groupId ? false : groupId));
    };

    return (
        <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden' }}>
            <Grid container spacing={0} sx={{ height: '100%' }}>
                {/* Columna izquierda: Búsqueda y lista de grupos */}
                <Grid item xs={12} md={7} sx={{ height: '100%', overflow: 'auto', padding: 2 }}>
                    <Paper elevation={8} style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
                        <Typography variant="h3" align="center" gutterBottom color="primary">
                            Dashboard de Grupos
                        </Typography>
                        <Divider variant="middle" style={{ margin: '20px 0' }} />
                        {userOrganization && (
                            <Typography variant="h6" align="center" color="textSecondary">
                                Organización: <strong>{userOrganization}</strong>
                            </Typography>
                        )}
                        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

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
                    ) : filteredGroups.length > 0 ? (
                        <Box mt={4}>
                            {filteredGroups.map(group => (
                                <Box key={group.grupo_id} mb={3}>
                                    <GroupPanel
                                        groupId={group.grupo_id}
                                        userIds={group.usuarios}
                                        users={users}
                                        leaderId={group.leader_id}
                                        expanded={searchTerm ? true : expandedGroup === group.grupo_id}
                                        onToggleExpand={() => handleToggleExpand(group.grupo_id)}
                                        searchTerm={searchTerm}
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

                </Paper>

                </Grid>

                {/* Columna derecha: Componente de Proyectos Abiertos */}
                <Grid item xs={12} md={5} sx={{ height: '100%', overflow: 'auto', padding: 2 }}>
                    <OpenProjects /> {/* Componente externo para mostrar los proyectos */}
                    <Box mt={4}>
                        <Paper elevation={8} style={{ padding: '20px', backgroundColor: '#f3f4f6' }}>
                            <Typography variant="h4" gutterBottom color="secondary">
                                Estadísticas de Grupos
                            </Typography>
                            <Box mt={3}>
                                <Typography variant="body1">Grupos Totales: {grupos.length}</Typography>
                                <Typography variant="body1">Usuarios Totales: {users.length}</Typography>
                                <Typography variant="body1">Proyectos Activos: {grupos.length}</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>
            </Grid>
        </Container>
    );
};

export default ManagerDashboard;
