// GroupPanel.tsx
import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SimpleTable from './SimpleTable';

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

interface GroupPanelProps {
    groupId: number;
    userIds: number[];
    users: GitHubUser[];
    leaderId: number | null;
}

const GroupPanel: React.FC<GroupPanelProps> = ({ groupId, userIds, users, leaderId }) => {
    // Filtra los usuarios del grupo
    const groupUsers = userIds
        .map(userId => users.find(user => user.id === userId))
        .filter(user => user !== undefined) as GitHubUser[];

    // Extrae detalles específicos para la tabla, incluyendo el avatar y si es líder
    const groupDetails = groupUsers.map(user => ({
        id: user.id,
        name: user.username,
        avatarUrl: user.avatar_url,
        commits: user.commits,
        contributions: user.contributions,
        pullRequests: user.pullRequests,
        reviews: user.reviews,
        isLeader: leaderId === user.id,
    }));

    return (
        <Accordion>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${groupId}-content`}
                id={`panel-${groupId}-header`}
            >
                <Typography variant="h6">Grupo {groupId}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <SimpleTable details={groupDetails} /> {/* Tabla con detalles, incluyendo avatar */}
            </AccordionDetails>
        </Accordion>
    );
};

export default GroupPanel;
