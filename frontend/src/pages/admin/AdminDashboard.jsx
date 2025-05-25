import React from 'react';
import { Typography, Box, Paper, Grid, Card, Button, Fade, useMediaQuery } from '@mui/material';
import { AdminPanelSettings, AddCircle, AssignmentTurnedIn, CheckCircle, ListAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import AdminNavbar from '../../components/AdminNavbar';
import AdminSidebar from '../../components/AdminSidebar';
import { useNavigate } from 'react-router-dom';

const stats = [];

const recentActivity = [];

const quickActions = [
  { icon: <AddCircle />, label: 'Add Group', color: 'primary', onClick: null },
  { icon: <AssignmentTurnedIn />, label: 'Add Assignment', color: 'secondary', onClick: 'assignments' },
  { icon: <CheckCircle />, label: 'Mark Attendance', color: 'success', onClick: null },
  { icon: <ListAlt />, label: 'Upload Resource', color: 'info', onClick: null },
];

const assignmentsDue = [
  { title: 'Math Homework', due: 'Tomorrow' },
  { title: 'Science Project', due: 'In 2 days' },
];

const attendanceOverview = [
  { session: 'April 25', rate: '95%' },
  { session: 'April 24', rate: '90%' },
  { session: 'April 23', rate: '92%' },
];

const upcomingEvents = [
  { event: 'Webinar: AI Trends', date: 'April 29, 10:00 AM' },
  { event: 'Group Meeting', date: 'May 1, 2:00 PM' },
];

const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem('admin_notifications') || '[]');
  } catch {
    return [];
  }
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedPanel, setSelectedPanel] = React.useState('dashboard');
  const [notifications, setNotifications] = React.useState(getNotifications());
  const isMobile = useMediaQuery('(max-width:900px)');
  const navigate = useNavigate();

  // Helper to add notification (store icon name string, not JSX)
  const addNotification = (msg, iconName = "Notifications") => {
    const newNote = { text: msg, iconName, time: new Date().toLocaleTimeString() };
    const updated = [newNote, ...notifications].slice(0, 10);
    setNotifications(updated);
    localStorage.setItem('admin_notifications', JSON.stringify(updated));
  };

  // Main content panels
  const renderPanel = () => {
    switch (selectedPanel) {
      case 'dashboard':
      default:
        return (
          <Fade in timeout={500}>
            <Box>
              <Box display="flex" flexDirection="row" alignItems="center" mb={3} gap={2}>
                <Box sx={{ bgcolor: 'primary.main', width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AdminPanelSettings fontSize="large" style={{ color: '#fff' }} />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} gutterBottom>Admin Dashboard</Typography>
                  <Typography variant="h6" color="text.secondary">
                    Welcome, {user?.name}!
                  </Typography>
                </Box>
              </Box>
              <Grid container spacing={3}>
                {/* Statistics Cards */}
{stats.length === 0 ? (
  <Grid item xs={12}>
    <Card elevation={2} sx={{ p: 2, textAlign: 'center' }}>
      <Typography variant="subtitle1">No statistics yet.</Typography>
    </Card>
  </Grid>
) : (
  stats.map((stat, idx) => (
    <Grid item xs={12} md={3} key={idx}>
      <Card elevation={2} sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          {stat.icon}
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
            <Typography variant="h6" fontWeight={700}>{stat.value}</Typography>
          </Box>
        </Box>
      </Card>
    </Grid>
  ))
)}
{/* Quick Actions + Assignments Due */}
<Grid item xs={12} md={4}>
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Quick Actions</Typography>
    <Box display="flex" gap={2} flexWrap="wrap">
      {quickActions.map((action, idx) => (
  <Grid item xs={6} key={idx}>
    <Button
      variant="contained"
      color={action.color}
      startIcon={action.icon}
      fullWidth
      sx={{ mb: 1 }}
      onClick={
        action.onClick === 'assignments'
          ? () => navigate('/admin/assignments')
          : undefined
      }
    >
      {action.label}
    </Button>
  </Grid>
))}
    </Box>
  </Paper>
  <Paper elevation={2} sx={{ p: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Assignments Due</Typography>
    {assignmentsDue.length === 0 ? (
      <Typography variant="body2">No assignments due.</Typography>
    ) : (
      assignmentsDue.map((a, idx) => (
        <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
          <ListAlt color="info" />
          <Typography>{a.title}</Typography>
          <Typography variant="caption" color="text.secondary">{a.due}</Typography>
        </Box>
      ))
    )}
  </Paper>
</Grid>
{/* Notifications/Alerts + Attendance Overview */}
<Grid item xs={12} md={4}>
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Notifications & Alerts</Typography>
    {notifications.length === 0 ? (
      <Typography variant="subtitle1">No notifications yet.</Typography>
    ) : (
      notifications.map((n, idx) => {
        const MuiIcons = require('@mui/icons-material');
        const IconComponent = MuiIcons[n.iconName] || MuiIcons.Notifications;
        return (
          <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
            <IconComponent color="primary" />
            <Typography>{n.text}</Typography>
            <Typography variant="caption" color="text.secondary">{n.time}</Typography>
          </Box>
        );
      })
    )}
  </Paper>
  <Paper elevation={2} sx={{ p: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Attendance Overview</Typography>
    {attendanceOverview.length === 0 ? (
      <Typography variant="body2">No attendance data.</Typography>
    ) : (
      attendanceOverview.map((a, idx) => (
        <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
          <CheckCircle color="success" />
          <Typography>{a.session}</Typography>
          <Typography variant="caption" color="text.secondary">{a.rate}</Typography>
        </Box>
      ))
    )}
  </Paper>
</Grid>
{/* Recent Activity + Upcoming Events */}
<Grid item xs={12} md={4}>
  <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Recent Activity</Typography>
    {recentActivity.length === 0 ? (
      <Typography variant="body2">No recent activity.</Typography>
    ) : (
      recentActivity.map((a, idx) => (
        <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
          <AssignmentTurnedIn color="secondary" />
          <Typography>{a.text}</Typography>
          <Typography variant="caption" color="text.secondary">{a.time}</Typography>
        </Box>
      ))
    )}
  </Paper>
  <Paper elevation={2} sx={{ p: 2 }}>
    <Typography variant="subtitle1" fontWeight={600} mb={1}>Upcoming Events</Typography>
    {upcomingEvents.length === 0 ? (
      <Typography variant="body2">No upcoming events.</Typography>
    ) : (
      upcomingEvents.map((e, idx) => (
        <Box key={idx} display="flex" alignItems="center" gap={2} mb={1}>
          <AdminPanelSettings color="primary" />
          <Typography>{e.event}</Typography>
          <Typography variant="caption" color="text.secondary">{e.date}</Typography>
        </Box>
      ))
    )}
  </Paper>
</Grid>
              </Grid>
            </Box>
          </Fade>
        );
      case 'groups':
        return <Fade in timeout={500}><Box p={2}><Typography variant="h5">Group Management (Coming Soon)</Typography></Box></Fade>;
      case 'students':
        return <Fade in timeout={500}><Box p={2}><Typography variant="h5">Student Management (Coming Soon)</Typography></Box></Fade>;
      case 'assignments':
        return <Fade in timeout={500}><Box p={2}><Typography variant="h5">Assignments (Coming Soon)</Typography></Box></Fade>;
      case 'events':
        return <Fade in timeout={500}><Box p={2}><Typography variant="h5">Events (Coming Soon)</Typography></Box></Fade>;
      case 'settings':
        return <Fade in timeout={500}><Box p={2}><Typography variant="h5">Settings (Coming Soon)</Typography></Box></Fade>;
    }
  };

  // Navbar logout stub
  const handleLogout = () => {
    // Implement logout logic here
    window.location.href = '/login';
  };

  // Layout
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
      <AdminNavbar user={user} onLogout={handleLogout} />
      <AdminSidebar
  selected={selectedPanel}
  onNavigate={(path, key) => {
    setSelectedPanel(key);
    navigate(path);
  }}
/>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 2 : 4,
          mt: 8,
          ml: isMobile ? 0 : '220px',
          transition: 'margin 0.3s',
          width: '100%',
        }}
      >
        {renderPanel()}
      </Box>
    </Box>
  );
};

export default AdminDashboard;
