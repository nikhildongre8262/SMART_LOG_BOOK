import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Button from '@mui/material/Button';

import Badge from '@mui/material/Badge';
import api from '../../api/api';
import { toast } from 'react-toastify';
import GlassCard from '../../components/GlassCard';
import AnimatedProgressCircle from '../../components/AnimatedProgressCircle';
import CommandButton from '../../components/CommandButton';
import RecentActivityFeed from '../../components/RecentActivityFeed';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import HomeIcon from '@mui/icons-material/Home';

import GroupsPanel from './groups/GroupsPanel.jsx';
import StudentSidebar from './StudentSidebar';
import StudentTopbar from './StudentTopbar';
import AttendanceCalendar from './attendance/AttendanceCalendar.jsx';
import StudentAttendanceDashboard from './attendance/StudentAttendanceDashboard.jsx';
import NotificationsPanel from './dashboard/NotificationsPanel.jsx';
import GroupChat from './groupchat/GroupChat.jsx';
import HelpSupport from './help/HelpSupport.jsx';
import Settings from './settings/Settings.jsx';
import StudyResources from './resources/StudyResources.jsx';
import StudentProfile from './profile/StudentProfile.jsx';
// MUI Icons
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentDashboard from './assignment/AssignmentDashboard';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import StudentNavbar from '../../components/StudentNavbar';
import StudentBottomTabBar from '../../components/StudentBottomTabBar';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

// Pattern 4: Gamified Board / Tile-Based Dashboard
// All main dashboard options as interactive tiles in a grid, with gamification elements

const StudentMainDashboard = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [groups, setGroups] = useState([]);
  const [profile, setProfile] = useState({ name: '', avatar: '', email: '' });
  const [badges, setBadges] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [events, setEvents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const [overviewRes, groupsRes, profileRes, badgesRes, attendanceRes, eventsRes] = await Promise.all([
          api.get('/student/overview'),
          api.get('/student/groups'),
          api.get('/student/profile'),
          api.get('/student/badges'),
          api.get('/student/attendance'),
          api.get('/student/events'),
        ]);
        setOverview(overviewRes.data);
        setGroups(groupsRes.data);
        setProfile(profileRes.data);
        setBadges(badgesRes.data);
        setAttendance(attendanceRes.data);
        setEvents(eventsRes.data);
        // Optionally fetch assignments if you have an endpoint
        // setAssignments(assignmentsRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      }
      setLoading(false);
    }
    fetchDashboardData();
  }, []);

  // Attendance %
  const attendancePercent = attendance && attendance.length && overview && overview.totalSessions
    ? Math.round((attendance.length / overview.totalSessions) * 100)
    : 0;

  // Recent activity (mocked for now)
  const recentActivity = [
    ...(groups?.length ? [{
      icon: <MenuBookIcon sx={{ color: '#6366f1' }} />,
      title: `Joined group: ${groups[0]?.name}`,
      time: 'Just now',
      description: `You joined the group "${groups[0]?.name}".`
    }] : []),
    ...(badges?.length ? [{
      icon: <EmojiEventsIcon sx={{ color: '#f59e42' }} />,
      title: `Earned badge: ${badges[0]?.name || 'Badge'}`,
      time: 'Today',
      description: `You earned the "${badges[0]?.name || 'Badge'}" badge!`
    }] : []),
    ...(attendance?.length ? [{
      icon: <EventAvailableIcon sx={{ color: '#10b981' }} />,
      title: `Attendance marked`,
      time: 'Today',
      description: `Your attendance was recorded.`
    }] : []),
    ...(overview?.assignmentsDue ? [{
      icon: <AssignmentIcon sx={{ color: '#f43f5e' }} />,
      title: `Assignments Due: ${overview.assignmentsDue}`,
      time: 'Upcoming',
      description: `You have ${overview.assignmentsDue} assignments due soon.`
    }] : []),
    ...(events?.length ? [{
      icon: <EventAvailableIcon sx={{ color: '#6366f1' }} />,
      title: `Event: ${events[0]?.name}`,
      time: 'Upcoming',
      description: events[0]?.description || 'Event details.'
    }] : []),
  ];

  // Upcoming assignments/events (mocked for now)
  const upcoming = [
    ...(overview?.assignmentsDue ? [{
      icon: <AssignmentIcon color="warning" />,
      title: `Assignments Due: ${overview.assignmentsDue}`,
      date: 'Soon',
    }] : []),
    ...(events?.length ? events.slice(0, 2).map(ev => ({
      icon: <EventAvailableIcon color="info" />,
      title: ev.name,
      date: ev.date || 'Upcoming',
    })) : []),
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 4, p: { xs: 1, md: 3 } }}>
      {/* Hero Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Avatar src={profile.avatar} sx={{ width: 90, height: 90, fontSize: 40, bgcolor: 'primary.main' }}>
          {(!profile.avatar && profile.name) ? profile.name[0] : ''}
        </Avatar>
        <Box>
          <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
            Welcome, {profile.name || 'Student'}!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Here's your learning snapshot for today.
          </Typography>
        </Box>
      </Box>
      {/* Stats Cards Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <MenuBookIcon sx={{ fontSize: 38, color: '#6366f1', mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{groups.length}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Groups Joined</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <AssignmentIcon sx={{ fontSize: 38, color: '#f59e42', mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{overview?.assignmentsDue ?? 0}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Assignments Due</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <EventAvailableIcon sx={{ fontSize: 38, color: '#10b981', mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{attendancePercent}%</Typography>
            <Typography variant="subtitle2" color="text.secondary">Attendance</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 38, color: '#f59e42', mb: 1 }} />
            <Typography variant="h4" fontWeight={700}>{badges.length}</Typography>
            <Typography variant="subtitle2" color="text.secondary">Badges</Typography>
          </Paper>
        </Grid>
      </Grid>
      {/* Profile Overview and Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Profile Overview</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar src={profile.avatar} sx={{ width: 56, height: 56, fontSize: 28, bgcolor: 'primary.main' }}>
                {(!profile.avatar && profile.name) ? profile.name[0] : ''}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{profile.name}</Typography>
                <Typography variant="body2" color="text.secondary">{profile.email}</Typography>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2"><b>Groups Joined:</b> {groups.length}</Typography>
              <Typography variant="body2"><b>Assignments Due:</b> {overview?.assignmentsDue ?? 0}</Typography>
              <Typography variant="body2"><b>Attendance:</b> {attendancePercent}%</Typography>
              <Typography variant="body2"><b>Badges:</b> {badges.length}</Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" color="primary" fullWidth onClick={() => navigate('/student/profile')}>Edit Profile</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Recent Activity</Typography>
            {recentActivity.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No recent activity.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentActivity.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {item.icon}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Upcoming</Typography>
            {upcoming.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No upcoming assignments or events.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcoming.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {item.icon}
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentMainDashboard;
