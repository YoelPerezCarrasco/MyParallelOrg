// UserWorkGroup.tsx

import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, Checkbox, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SimpleTable from '../manager_dashboard/groups/SimpleTable';

interface User {
  id: number;
  username: string;
  avatar_url: string;
}

interface WorkGroup {
  grupo_id: number;
  leader_id: number | null;
  project_id: number | null;
  is_leader: boolean;
}

interface Member {
  id: number;
  name: string;
  avatarUrl: string;
  commits: number;
  contributions: number;
  pullRequests: number;
  reviews: number;
  isLeader: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  url: string;
}

const UserWorkGroup: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workGroup, setWorkGroup] = useState<WorkGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [isLeader, setIsLeader] = useState<boolean>(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Obtener datos del usuario
        const responseUser = await fetch('/api//auth/users/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataUser = await responseUser.json();
        if (responseUser.ok && dataUser.id) {
          setUser({
            id: dataUser.id,
            username: dataUser.username,
            avatar_url: dataUser.avatar_url,
          });
        }

        // Obtener grupo de trabajo del usuario
        const responseGroup = await fetch('/api//workgroups/workgroups/user/group', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dataGroup = await responseGroup.json();

        console.log("Group response:", dataGroup); // Log de respuesta

        if (responseGroup.ok && dataGroup.grupo_id !== undefined && dataGroup.grupo_id !== null) {
          setWorkGroup(dataGroup);
          setIsLeader(dataGroup.is_leader);

          // Obtener proyecto asignado al grupo
          const responseProject = await fetch(`/api//projects/projects/group/${dataGroup.grupo_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (responseProject.ok) {
            const dataProject = await responseProject.json();
            setProject(dataProject);

            // Obtener miembros del grupo con detalles
            const responseMembers = await fetch(`/api//workgroups/workgroups/group/${dataGroup.grupo_id}/members/details`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const dataMembers = await responseMembers.json();
            if (responseMembers.ok) {
              setMembers(dataMembers);
            }
          } else {
            // No hay proyecto asignado
            setProject(null);

            // Obtener miembros del grupo sin detalles
            const responseMembers = await fetch(`/api//workgroups/workgroups/group/${dataGroup.grupo_id}/members`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const dataMembers = await responseMembers.json();
            if (responseMembers.ok) {
              // Convertir dataMembers al formato esperado por SimpleTable
              const membersData = dataMembers.map((member: any) => ({
                id: member.id,
                name: member.username,
                avatarUrl: member.avatar_url,
                commits: 0,
                contributions: 0,
                pullRequests: 0,
                reviews: 0,
                isLeader: member.is_leader,
              }));
              setMembers(membersData);
            }
          }

          // Si es líder, obtener todos los proyectos disponibles
          if (dataGroup.is_leader) {
            const responseProjects = await fetch('/api//projects/projects/available', {
              headers: { Authorization: `Bearer ${token}` },
            });
            const dataProjects = await responseProjects.json();
            if (responseProjects.ok) {
              setAllProjects(dataProjects);
            }
          }
        } else {
          console.error('No se encontró grupo de trabajo para el usuario.');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAssignProject = () => setOpenDialog(true);

  const handleConfirmAssign = async () => {
    if (selectedProject && workGroup) {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`/api//projects/projects/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            group_id: workGroup.grupo_id,
            project_id: selectedProject,
          }),
        });
        if (response.ok) {
          const dataProject = await response.json();
          setProject(dataProject);
          setOpenDialog(false);

          // Actualizar los detalles de los miembros con las nuevas estadísticas del proyecto asignado
          const responseMembers = await fetch(`/api//workgroups/workgroups/group/${workGroup.grupo_id}/members/details`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const dataMembers = await responseMembers.json();
          if (responseMembers.ok) {
            setMembers(dataMembers);
          }
        } else {
          console.error('Error al asignar el proyecto');
        }
      } catch (error) {
        console.error('Error assigning project:', error);
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ padding: 3 }}>
      <Typography variant="h5" gutterBottom>Mi Grupo de Trabajo</Typography>
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : workGroup ? (
        <>
          <Typography variant="subtitle1">Grupo ID: {workGroup.grupo_id}</Typography>
          <Typography variant="subtitle1">Proyecto Asignado: {project ? project.name : 'No asignado'}</Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>Miembros del Grupo:</Typography>
          {/* Usar SimpleTable para mostrar los miembros */}
          <SimpleTable details={members} />
          {isLeader && (
            <Button variant="contained" color="primary" onClick={handleAssignProject} sx={{ mt: 2 }}>
              Asignar Proyecto
            </Button>
          )}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
            <DialogTitle>Asignar Proyecto al Grupo</DialogTitle>
            <DialogContent>
              <List>
                {allProjects.map((proj) => (
                  <ListItem
                    key={proj.id}
                    component="div"
                    onClick={() => setSelectedProject(proj.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Checkbox checked={selectedProject === proj.id} />
                    <ListItemText primary={proj.name} />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button onClick={handleConfirmAssign} variant="contained" color="primary">
                Asignar
              </Button>
            </DialogActions>
          </Dialog>
        </>
      ) : (
        <Typography>No perteneces a ningún grupo de trabajo actualmente.</Typography>
      )}
    </Paper>
  );
};

export default UserWorkGroup;
