import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Avatar, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

const StudentTopbar = ({ avatar, studentName = 'Student' }) => {
  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: 64 }}>
        <Typography variant="h6" fontWeight={700} color="primary">
          Welcome, {studentName} <span role="img" aria-label="wave">👋</span>
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar alt={studentName} src={avatar} sx={{ bgcolor: '#1976d2' }}>
            {(!avatar && studentName) ? studentName[0] : ''}
          </Avatar>
          <IconButton color="error" onClick={() => { localStorage.removeItem('token'); window.location.reload(); }}>
            <LogoutIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default StudentTopbar;
