import React, { useEffect, useState } from 'react';
import StudentTopbar from './StudentTopbar';
import StudentSidebar from './StudentSidebar';
import StudentBottomTabBar from '../../components/StudentBottomTabBar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import axios from 'axios';

const StudentLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', avatar: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/student/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data);
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchProfile();
  }, []);

  // Determine which tab is active based on the current path
  const getTabIndex = () => {
    if (location.pathname.startsWith('/student/groups')) return 1;
    if (location.pathname.startsWith('/student/attendance')) return 2;
    if (location.pathname.startsWith('/student/resources')) return 3;
    if (location.pathname.startsWith('/student/profile')) return 4;
    return 0; // dashboard
  };

  const handleTabChange = (newValue) => {
    switch (newValue) {
      case 0: navigate('/student/dashboard'); break;
      case 1: navigate('/student/groups'); break;
      case 2: navigate('/student/attendance'); break;
      case 3: navigate('/student/resources'); break;
      case 4: navigate('/student/profile'); break;
      default: break;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6fb' }}>
      <StudentTopbar avatar={profile.avatar} studentName={profile.name} />
      <Box sx={{ display: 'flex', minHeight: '100vh', pt: '64px' }}>
        <StudentSidebar />
        <Box sx={{ flex: 1, minHeight: '100vh', bgcolor: '#f4f6fb', p: { xs: 1, md: 3 } }}>
          <Outlet />
          <StudentBottomTabBar value={getTabIndex()} onChange={handleTabChange} />
        </Box>
      </Box>
    </Box>
  );
};

export default StudentLayout; 