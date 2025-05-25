import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Tooltip 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Assignment as AssignmentIcon, 
  CalendarMonth as CalendarIcon, 
  MenuBook as ResourcesIcon,
  Forum as ForumIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const StudentSidebar = ({ selected }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/student/dashboard',
      id: 'dashboard'
    },
    {
      text: 'Assignments',
      icon: <AssignmentIcon />,
      path: '/student/assignments',
      id: 'assignments'
    },
    {
      text: 'Attendance',
      icon: <CalendarIcon />,
      path: '/student/attendance',
      id: 'attendance'
    },
    {
      text: 'Resources',
      icon: <ResourcesIcon />,
      path: '/student/resources',
      id: 'resources'
    },
    {
      text: 'Forum',
      icon: <ForumIcon />,
      path: '/student/forum',
      id: 'forum'
    }
  ];

  const bottomItems = [
    {
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/student/settings',
      id: 'settings'
    }
  ];

  const isSelected = (itemId) => {
    if (selected) {
      return selected === itemId;
    }
    
    // Otherwise try to match by path
    return location.pathname.includes(itemId);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 220,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 220,
          boxSizing: 'border-box',
          mt: '64px', // height of navbar
          backgroundColor: '#f8f9fa',
          borderRight: '1px solid #e0e0e0',
        },
        display: { xs: 'none', md: 'block' } // Hide on mobile, show on desktop
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => (
            <Tooltip key={item.id} title={item.text} placement="right" arrow>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected(item.id)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 24px 24px 0',
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected(item.id) ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected(item.id) ? 600 : 400, 
                      color: isSelected(item.id) ? 'primary.main' : 'text.primary' 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <List>
          {bottomItems.map((item) => (
            <Tooltip key={item.id} title={item.text} placement="right" arrow>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isSelected(item.id)}
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '0 24px 24px 0',
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                      },
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: isSelected(item.id) ? 'primary.main' : 'text.secondary'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isSelected(item.id) ? 600 : 400, 
                      color: isSelected(item.id) ? 'primary.main' : 'text.primary' 
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default StudentSidebar;
