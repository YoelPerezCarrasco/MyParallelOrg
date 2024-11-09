// SearchBar.tsx
import React from 'react';
import { TextField, Box } from '@mui/material';

interface SearchBarProps {
    searchTerm: string;
    onSearchChange: (newSearchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchChange }) => {
    return (
        <Box mb={3} display="flex" justifyContent="center">
            <TextField
                variant="outlined"
                label="Buscar usuario por nombre"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                style={{ width: '50%', top: '30px' }}
            />
        </Box>
    );
};

export default SearchBar;
