import React from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import StudentTopbar from './StudentTopbar';
import Box from '@mui/material/Box';

const StudentDashboard = () => (
  <Box sx={{ minHeight: '100vh', background: '#f4f6fa' }}>
    <StudentTopbar />
    <Box sx={{ p: 3, mt: '64px' }}>
      <Outlet />
    </Box>
  </Box>
);

export default StudentDashboard;
