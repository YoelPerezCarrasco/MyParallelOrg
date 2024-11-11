// OpenProjects.tsx
import React, { useState, useEffect, Fragment } from 'react';
import {
  Box,
  Fab,
  Card,
  Grid,
  styled,
  Avatar,
  Checkbox,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import { DateRange, MoreVert, StarOutline } from '@mui/icons-material';
import { format } from 'date-fns';


interface Contributor {
  avatar_url: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  url: string;
  created_at: string;
  contributors?: Contributor[];
}

// STYLED COMPONENTS
const ProjectName = styled(Typography)(({ theme }) => ({
  marginLeft: 24,
  fontWeight: 500,
  textDecoration: 'none',
  color: theme.palette.text.primary,
  [theme.breakpoints.down('sm')]: { marginLeft: 4 },
}));

const StyledFabStar = styled(Fab)(({ theme }) => ({
  marginLeft: 0,
  boxShadow: 'none',
  color: 'white',
  backgroundColor: '#08ad6c',
  [theme.breakpoints.down('sm')]: { display: 'none' },
}));

const StyledFab = styled(Fab)(({ theme }) => ({
  marginLeft: 0,
  boxShadow: 'none',
  color: 'white',
  backgroundColor: theme.palette.error.main,
  [theme.breakpoints.down('sm')]: { display: 'none' },
}));

const StyledAvatar = styled(Avatar)(() => ({
  width: '32px',
  height: '32px',
  marginLeft: '-8px',
  border: '2px solid white',
}));

const OpenProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      try {
        const response = await fetch('http://localhost:8000/stadistics/organization/manager/projects', {
          headers: { Authorization: `Bearer ${token}` },
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
    <Box>
      <Typography variant="h4" gutterBottom color="secondary">
        Proyectos Abiertos
      </Typography>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="100px">
          <CircularProgress color="secondary" size={30} />
        </Box>
      ) : (
        <>
          {projects.length > 0 ? (
            projects.map((project) => (
              <Fragment key={project.id}>
                <Card sx={{ py: 1, px: 2 }} className="project-card">
                  <Grid container alignItems="center">
                    {/* Columna del Nombre del Proyecto */}
                    <Grid item md={5} xs={7}>
                      <Box display="flex" alignItems="center">
                        <Checkbox />

                        {project.id % 2 === 1 ? (
                          <StyledFabStar size="small">
                            <StarOutline />
                          </StyledFabStar>
                        ) : (
                          <StyledFab size="small">
                            <DateRange />
                          </StyledFab>
                        )}

                        <ProjectName variant="body1">
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            {project.name}
                          </a>
                        </ProjectName>
                      </Box>
                    </Grid>

                    {/* Columna de la Fecha */}
                    <Grid item md={3} xs={4}>
                      <Box color="text.secondary">
                        {project.created_at
                          ? format(new Date(project.created_at), 'dd/MM/yyyy hh:mma')
                          : 'Sin fecha'}
                      </Box>
                    </Grid>

                    {/* Columna de los Contribuidores */}
                    <Grid item xs={3} sx={{ display: { xs: 'none', sm: 'block' } }}>
                      <Box display="flex" position="relative" marginLeft="-0.875rem">
                        {project.contributors && project.contributors.length > 0 ? (
                          project.contributors.slice(0, 3).map((contributor, index) => (
                            <StyledAvatar
                              key={index}
                              src={contributor.avatar_url}
                              alt="Contribuidor"
                            />
                          ))
                        ) : (
                          <StyledAvatar />
                        )}
                        {project.contributors && project.contributors.length > 3 && (
                          <StyledAvatar sx={{ fontSize: '14px' }}>
                            +{project.contributors.length - 3}
                          </StyledAvatar>
                        )}
                      </Box>
                    </Grid>

                    {/* Columna de Opciones */}
                    <Grid item xs={1}>
                      <Box display="flex" justifyContent="flex-end">
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Grid>
                  </Grid>
                </Card>

                <Box py={1} />
              </Fragment>
            ))
          ) : (
            <Typography variant="body1" color="textSecondary">
              No hay proyectos abiertos en la organización.
            </Typography>
          )}
        </>
      )}
    </Box>
  );
};

export default OpenProjects;
