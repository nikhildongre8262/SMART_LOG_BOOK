import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate, useLocation } from 'react-router-dom';

const StudentBottomTabBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Map routes to tab indices
  const routeToValue = {
    '/student/dashboard': 0,
    '/student/assignments': 1,
    '/student/groups': 2,
    '/student/attendance': 3,
    '/student/resources': 4,
    '/student/profile': 5
  };

  const handleNavigation = (newValue) => {
    const routes = [
      '/student/dashboard',
      '/student/assignments',
      '/student/groups',
      '/student/attendance',
      '/student/resources',
      '/student/profile'
    ];
    navigate(routes[newValue]);
  };

  // Get current tab value based on route
  const currentValue = Object.keys(routeToValue).find(key => 
    location.pathname.startsWith(key)
  );

  return (
    <Paper elevation={0} sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, borderRadius: 0, boxShadow: 'none !important' }}>
      <BottomNavigation
        value={routeToValue[currentValue] || 0}
        onChange={(_, newValue) => handleNavigation(newValue)}
        showLabels
        sx={{ height: 64, bgcolor: '#fff', borderTop: '1px solid #e0e7ff', boxShadow: 'none !important' }}
      >
        <BottomNavigationAction label="Dashboard" icon={<HomeIcon />} />
        <BottomNavigationAction label="Assignments" icon={<AssignmentIcon />} />
        <BottomNavigationAction label="Groups" icon={<MenuBookIcon />} />
        <BottomNavigationAction label="Attendance" icon={<CalendarMonthIcon />} />
        <BottomNavigationAction label="Resources" icon={<MenuBookIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
};

export default StudentBottomTabBar;
