// OpenProjects.tsx
import React, { useState, useEffect } from 'react';
import { Paper, Typography, CircularProgress, Box, Divider } from '@mui/material';

interface Project {
    id: number;
    name: string;
    description: string;
    url: string;
}

const OpenProjects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setIsLoading(true);
            const token = localStorage.getItem('token');
            try {
                const response = await fetch('http://localhost:8000/stadistics/organization/manager/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    const data: Project[] = await response.json();
                    setProjects(data);
                } else {
                    alert('No se pudieron obtener los proyectos de la organización');
                }
            } catch (error) {
                console.error('Error obteniendo proyectos:', error);
                alert('Ocurrió un error al obtener los proyectos');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjects();
    }, []);

    return (
        <Paper elevation={8} style={{ padding: '20px', backgroundColor: '#e9f7fa' }}>
            <Typography variant="h4" gutterBottom color="secondary">
                Proyectos Abiertos
            </Typography>
            {isLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="100px">
                    <CircularProgress color="secondary" size={30} />
                </Box>
            ) : (
                <Box mt={3}>
                    {projects.length > 0 ? (
                        projects.map((project) => (
                            <Box key={project.id} mb={2}>
                                <Typography variant="body1">
                                    <a href={project.url} target="_blank" rel="noopener noreferrer">
                                        {project.name}
                                    </a>
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {project.description || 'No hay descripción disponible'}
                                </Typography>
                                <Divider style={{ margin: '10px 0' }} />
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body1" color="textSecondary">
                            No hay proyectos abiertos en la organización.
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default OpenProjects;
