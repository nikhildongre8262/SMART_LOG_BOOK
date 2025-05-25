import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import SettingsIcon from '@mui/icons-material/Settings';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';

const drawerWidth = 220;

const navItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, key: 'dashboard', navPath: '/admin' },
  { label: 'Groups', icon: <GroupIcon />, key: 'groups', navPath: '/admin/groups' },
  { label: 'Attendance', icon: <AssignmentIcon />, key: 'attendance', navPath: '/admin/attendance' },
  { label: 'Assignments', icon: <AssignmentIcon />, key: 'assignments', navPath: '/admin/assignments' },
  { label: 'Study Resources', icon: <LibraryBooksIcon />, key: 'study-resource', navPath: '/admin/study-resource' },
  { label: 'Settings', icon: <SettingsIcon />, key: 'settings', navPath: '/admin/settings' },
];

import { useNavigate } from 'react-router-dom';

const AdminSidebar = ({ selected, onNavigate }) => {
  const navigate = useNavigate();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        position: 'fixed',
        height: '100vh',
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: '#f7f9fc',
          top: '64px', // Height of AppBar
          height: 'calc(100vh - 64px)',
          position: 'fixed',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item) => (
            <ListItem
              button
              key={item.key}
              selected={selected === item.key}
              onClick={() => {
  if (onNavigate) onNavigate(item.navPath, item.key);
  else navigate(item.navPath);
}}
            >
              <ListItemIcon sx={{ color: selected === item.key ? 'primary.main' : 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Drawer>
  );
};

export default AdminSidebar;
