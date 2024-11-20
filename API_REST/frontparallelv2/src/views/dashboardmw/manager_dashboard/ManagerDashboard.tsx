// ManagerDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, CircularProgress, Box, Paper, Divider, Grid, Breadcrumbs, Link, Button } from '@mui/material';
import GroupPanel from './groups/GroupPanel';
import SearchBar from './SearchBar';
import OpenProjects from './OpenProjects';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'; // Icono informativo
import { Stack } from '@mui/material';

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

    const handleViewGraph = () => {
        if (userOrganization) {
            navigate(`/manager/graphs/${userOrganization}`);
        }
    };

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
        <Container maxWidth={false} disableGutters sx={{ height: '100vh', overflow: 'hidden', padding: 2 }}>
            {/* Rutas de navegación */}

            <Breadcrumbs aria-label="breadcrumb">
                    <Link color="inherit" href="/" onClick={(e: { preventDefault: () => any; }) => e.preventDefault()}>
                        Inicio
                    </Link>
                    <Link color="inherit" href="/dashboard" onClick={(e: { preventDefault: () => any; }) => e.preventDefault()}>
                        Manager Dashboard
                    </Link>
                    <Typography color="textPrimary">Jerarquía Paralela</Typography>
                </Breadcrumbs>
                
            <Box sx={{ padding: 2 }}>
               
            </Box>

            <Grid container spacing={4} sx={{ height: '100%' }}>
                {/* Columna izquierda: Búsqueda y lista de grupos */}
                <Grid item xs={12} md={7} sx={{ height: '100%', overflow: 'auto', padding: 2 }}>
                    <Paper elevation={8} style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>

                    <Paper elevation={3} sx={{ padding: 2, marginBottom: 2, backgroundColor: '#f4f6f8' }}>
                    <Typography variant="h6" align="center" color="textSecondary" sx={{ fontWeight: 'medium' }}>
                        Organización: <strong>{userOrganization}</strong>
                    </Typography>
                </Paper>   

                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleViewGraph}
                    sx={{ marginBottom: 2 }}
                >
                    Ver Gráfico de Organización
                </Button>
           
                <Box display="flex" justifyContent="left" alignItems="center" sx={{ marginBottom: 2 }}>
                    <InfoOutlinedIcon color="primary" sx={{ marginRight: 5 }} />
                    <Typography variant="body1" align="justify" color="textSecondary" sx={{ maxWidth: '100%' }}>
                        Esta sección muestra los <strong>Grupos de Trabajo sugeridos</strong> dentro de la organización 
                        "<strong>{userOrganization}</strong>". Los grupos se crean en base a las <strong>interacciones 
                        colaborativas</strong> en proyectos activos, optimizando el trabajo en equipo según las <strong>contribuciones 
                        y participaciones</strong> de cada miembro en los proyectos abiertos.
                    </Typography>
                </Box>



                <Paper elevation={3} sx={{ padding: 2, marginBottom: 3, backgroundColor: '#ffffff' }}>
                    <Typography variant="h6" align="center" color="primary">
                        Buscar Usuarios
                    </Typography>
                    <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

                <Divider variant="middle" style={{ margin: '20px 0' }} />
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
                    </Paper>
                </Grid>

            {/* Columna derecha: Proyectos Abiertos y Estadísticas de Grupos */}
            <Grid item xs={12} md={5} sx={{ height: '100%', overflow: 'auto', padding: 3 }}>
                {/* Sección de Proyectos Abiertos */}
                
                <Box display="flex" justifyContent="left" alignItems="center" sx={{ marginBottom: 2 }}>
                    <Paper elevation={6} sx={{ padding: 3, backgroundColor: '#f9f9f9' }}>
                        <Typography variant="h4" color="black" sx={{ fontWeight: 'bold', mb: 2 }}>
                            Proyectos Abiertos
                        </Typography>
                        <InfoOutlinedIcon color="primary" sx={{ marginRight: 5 }} />

                        <Typography variant="body1" align="justify" color="textSecondary" sx={{ maxWidth: '100%' }}>
                        Lista de proyectos activos en la organización donde los grupos de trabajo están colaborando. Estos proyectos
                            promueven la colaboración entre los equipos y ayudan a optimizar los recursos internos.
                        </Typography>
                        <OpenProjects /> {/* Renderiza el componente OpenProjects */}
                    </Paper>
                </Box>

              
            </Grid>
            </Grid>
        </Container>
    );
};

export default ManagerDashboard;
