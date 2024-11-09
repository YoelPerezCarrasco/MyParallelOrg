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
    expanded: boolean;
    onToggleExpand: () => void;
    searchTerm: string; // Nuevo prop para el término de búsqueda
}

const GroupPanel: React.FC<GroupPanelProps> = ({ groupId, userIds, users, leaderId, expanded, onToggleExpand, searchTerm }) => {
    // Filtra los usuarios del grupo en función del término de búsqueda
    const groupUsers = userIds
        .map(userId => users.find(user => user.id === userId))
        .filter(user => user !== undefined && (searchTerm ? user.username.toLowerCase().includes(searchTerm.toLowerCase()) : true)) as GitHubUser[];

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
        <Accordion expanded={expanded} onChange={onToggleExpand}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel-${groupId}-content`}
                id={`panel-${groupId}-header`}
            >
                <Typography variant="h6">Grupo {groupId}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                {groupDetails.length > 0 ? (
                    <SimpleTable details={groupDetails} />
                ) : (
                    <Typography variant="body2" color="textSecondary">
                        No se encontraron usuarios en este grupo para el término de búsqueda.
                    </Typography>
                )}
            </AccordionDetails>
        </Accordion>
    );
};

export default GroupPanel;
