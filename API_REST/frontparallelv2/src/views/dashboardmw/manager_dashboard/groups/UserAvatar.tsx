// UserAvatar.tsx
import React from 'react';
import { Avatar, Typography, Box } from '@mui/material';

interface GitHubUser {
    id: number;
    name: string;
    avatarUrl: string;
    commits: number;
    contributions: number;
    pullRequests: number;
    reviews: number;
    isLeader: boolean;
}

interface UserAvatarProps {
    user: GitHubUser;
    isLeader: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, isLeader }) => {
    return (
        <Box key={user.id} textAlign="center" m={0} position="relative">
            <Avatar src={user.avatarUrl} alt={user.name} style={{ width: 60, height: 60 }} />
            {isLeader && (
                <Box
                    position="absolute"
                    top={0}
                    right={0}
                    bgcolor="gold"
                    borderRadius="50%"
                    width={20}
                    height={20}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Typography variant="caption" style={{ fontWeight: 'bold' }}>
                        L
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default UserAvatar;
