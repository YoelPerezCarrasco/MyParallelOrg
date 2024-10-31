import React, { memo, useContext } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  styled,
  Avatar,
  Hidden,
  useTheme,
  MenuItem,
  IconButton,
  useMediaQuery,
  Menu,
  Typography
} from '@mui/material';
import {
  Home,
  Menu as MenuIcon,
  Person,
  Settings,
  PowerSettingsNew
} from '@mui/icons-material';

import AuthContext from '../../context/AuthContext';
import { parseJwt } from '../../utils/jwtDecode';

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: 'white',
}));

const TopbarRoot = styled("div")(({ theme }) => ({
  top: 0,
  zIndex: 96,
  height: 64,
  boxShadow: theme.shadows[3],
  transition: "all 0.3s ease",
  background: "#11101D",
  fontFamily: 'Poppins, sans-serif',
  position: "sticky",
}));

const TopbarContainer = styled(Box)(({ theme }) => ({
  padding: "8px 20px",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontFamily: 'Poppins, sans-serif',
  [theme.breakpoints.down("sm")]: { paddingLeft: 16, paddingRight: 16 }
}));

const UserMenuBox = styled(Box)({
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  fontFamily: 'Poppins, sans-serif',
});

const Layout1Topbar = () => {
  const theme = useTheme();
  const isMdScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { logoutUser } = useContext(AuthContext)!;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleUserMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isAuthenticated) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // Obtener el token y verificar si el usuario está autenticado
  const token = localStorage.getItem('authTokens');
  let isAuthenticated = false;
  
  let username: string | null = null;
  let is_admin: boolean | null = null;
  let is_manager: boolean | null = null;

  if (token) {
    const decoded = parseJwt(token);
    if (decoded) {
      username = decoded.username;
      isAuthenticated = true;
    }
  }

  return (
    <TopbarRoot>
      <TopbarContainer>
        <Box display="flex" alignItems="center">
          <StyledIconButton>
            <MenuIcon />
          </StyledIconButton>
        </Box>

        <Box display="flex" alignItems="center">
          {isAuthenticated && (
            <UserMenuBox onClick={handleUserMenuClick}>
              <Hidden smDown>
                <Typography variant="body1" sx={{ marginRight: 1, color: 'white', fontFamily: 'Poppins' }}>
                  Hola, <strong>{username || 'Usuario'}</strong>
                </Typography>
              </Hidden>
              <Avatar src="/path/to/avatar.jpg" sx={{ cursor: 'pointer' }} />
            </UserMenuBox>
          )}

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={handleUserMenuClose} sx={{ fontFamily: 'Poppins' }}>
              <Home sx={{ marginRight: 1 }} />
              <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontFamily: 'Poppins' }}>
                Inicio
              </Link>
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose} sx={{ fontFamily: 'Poppins' }}>
              <Person sx={{ marginRight: 1 }} />
              <Link
                to="/user/dashboard"
                style={{ textDecoration: 'none', color: 'inherit', fontFamily: 'Poppins' }}
              >
                Perfil
              </Link>
            </MenuItem>
            <MenuItem onClick={handleUserMenuClose} sx={{ fontFamily: 'Poppins' }}>
              <Settings sx={{ marginRight: 1 }} />
              <Link
                to="/settings"
                style={{ textDecoration: 'none', color: 'inherit', fontFamily: 'Poppins' }}
              >
                Configuración
              </Link>
            </MenuItem>
            <MenuItem
              onClick={() => {
                logoutUser();
                handleUserMenuClose();
              }}
              sx={{ fontFamily: 'Poppins' }}
            >
              <PowerSettingsNew sx={{ marginRight: 1 }} />
              <span>Cerrar sesión</span>
            </MenuItem>
          </Menu>
        </Box>
      </TopbarContainer>
    </TopbarRoot>
  );
};

export default memo(Layout1Topbar);
