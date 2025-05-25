import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, Collapse } from '@mui/material';
import { ExpandLess, ExpandMore, Folder } from '@mui/icons-material';
import { showSuccess, showError } from '../../../utils/toast';
import { ToastContainer } from 'react-toastify';
import axiosInstance from '../../../utils/axiosInstance';
import SubGroupModules from './SubGroupModules';
import { styled } from '@mui/material/styles';
import { School, Group, Refresh, Search, Cancel, Dashboard } from '@mui/icons-material';
import { InputAdornment, IconButton, Tooltip, TextField, Divider, Avatar, Button } from '@mui/material';
import JoinGroupDialog from './JoinGroupDialog';

// Add custom scrollbar styling
const ScrollableBox = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)', // Adjusted for navbar height
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': {
    width: '6px',
    height: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '3px',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.15)',
    },
  },
  '&::-webkit-scrollbar-corner': {
    background: 'transparent',
  },
}));

export default function GroupsPanel() {
  const [groups, setGroups] = useState([]);
  const [selectedMainGroup, setSelectedMainGroup] = useState(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [subGroups, setSubGroups] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');

  // Fetch joined groups from backend
  const fetchGroups = async (showToast, action) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/student/groups');
      setGroups(data);
      // If selected group is gone (left), clear selection
      if (selectedMainGroup && !data.some(g => g._id === selectedMainGroup)) {
        setSelectedMainGroup(null);
        setSelectedSubGroup(null);
      }
      if (showToast && action === 'join') showSuccess('Joined group successfully!');
      if (showToast && action === 'leave') showSuccess('Left group successfully!');
    } catch {
      showError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subgroups for a main group
  const fetchSubGroups = async (mainGroupId) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/student/groups/${mainGroupId}/subgroups`);
      setSubGroups(prev => ({ ...prev, [mainGroupId]: res.data }));
    } catch {
      showError('Failed to load subgroups');
      setSubGroups(prev => ({ ...prev, [mainGroupId]: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchGroups();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Handle main group expand/collapse
  const handleExpandMainGroup = (groupId) => {
    setSelectedMainGroup(groupId === selectedMainGroup ? null : groupId);
    setSelectedSubGroup(null);
    if (!subGroups[groupId]) {
      fetchSubGroups(groupId);
    }
    setExpandedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  // Handle subgroup select
  const handleSelectSubGroup = (mainGroupId, subGroupId) => {
    setSelectedMainGroup(mainGroupId);
    setSelectedSubGroup(subGroupId);
  };

  // Filtered main groups
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handler for joining a group
  const handleJoinGroup = async (groupCode, password) => {
    setJoinLoading(true);
    setJoinError('');
    try {
      // Send groupCode and password as required by backend
      await axiosInstance.post('/student/groups/join', { groupCode, password });
      setJoinDialogOpen(false);
      fetchGroups(true, 'join');
    } catch (err) {
      setJoinError(err.response?.data?.error || err.response?.data?.message || 'Failed to join group');
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      width: '100%',
      position: 'fixed',
      top: '64px',
      left: 0,
      overflow: 'hidden',
      bgcolor: '#fafafa',
      display: 'flex',
      flexDirection: 'column',
      pt: 0
    }}>
      <Grid 
        container 
        spacing={2}
        sx={{ 
          height: '100%',
          flex: 1,
          minHeight: 0,
          m: 0,
          p: 2,
          pr: 3
        }}
      >
        {/* Left Panel - Groups & Subgroups */}
        <Grid 
          item 
          xs={12} 
          md={3} 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              minHeight: 0,
              border: '1px solid',
              borderColor: '#eee',
              p: 2.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School color="primary" sx={{ mr: 1 }} /> My Groups
              </Typography>
              <Tooltip title="Refresh groups">
                <IconButton onClick={() => fetchGroups()} size="small" color="primary" sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#666', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2 }} />
            <ScrollableBox>
              <List sx={{ width: '100%' }}>
                {filteredGroups.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No groups found" sx={{ textAlign: 'center', color: 'text.secondary' }} />
                  </ListItem>
                ) : (
                  filteredGroups.map(group => (
                    <React.Fragment key={group._id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          onClick={() => handleExpandMainGroup(group._id)}
                          selected={selectedMainGroup === group._id}
                        >
                          <ListItemIcon>
                            <Group />
                          </ListItemIcon>
                          <ListItemText primary={group.name} />
                          {expandedGroups.includes(group._id) ? <ExpandLess /> : <ExpandMore />}
                        </ListItemButton>
                      </ListItem>
                      <Collapse in={expandedGroups.includes(group._id)} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2 }}>
                          {!subGroups[group._id] ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : subGroups[group._id].length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center">
                              No subgroups available
                            </Typography>
                          ) : (
                            <Grid container spacing={1}>
                              {subGroups[group._id].map(subGroup => (
                                <Grid item xs={6} key={subGroup._id}>
                                  <ListItemButton
                                    sx={{
                                      borderRadius: 1,
                                      border: '1px solid',
                                      borderColor: selectedSubGroup === subGroup._id ? 'primary.main' : 'divider',
                                      bgcolor: selectedSubGroup === subGroup._id ? 'primary.light' : 'background.paper',
                                      '&:hover': {
                                        bgcolor: selectedSubGroup === subGroup._id ? 'primary.light' : 'action.hover',
                                      }
                                    }}
                                    onClick={() => handleSelectSubGroup(group._id, subGroup._id)}
                                    selected={selectedSubGroup === subGroup._id}
                                  >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                      <Folder fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText 
                                      primary={subGroup.name}
                                      primaryTypographyProps={{
                                        variant: 'body2',
                                        noWrap: true
                                      }}
                                    />
                                  </ListItemButton>
                                </Grid>
                              ))}
                            </Grid>
                          )}
                        </Box>
                      </Collapse>
                    </React.Fragment>
                  ))
                )}
              </List>
            </ScrollableBox>
          </Paper>
        </Grid>
        {/* Right Panel - Subgroups/Modules */}
        <Grid 
          item 
          xs={12} 
          md={9} 
          sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#ffffff',
              minHeight: 0,
              border: '1px solid',
              borderColor: '#eee',
              p: 2.5
            }}
          >
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Group color="primary" sx={{ mr: 1 }} />
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  Groups
                </Typography>
              </Box>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                Manage your group memberships and explore subgroups.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Tooltip title="Dashboard"><IconButton size="small" onClick={() => window.location.href = '/student/dashboard'}><Dashboard color="primary" /></IconButton></Tooltip>
                <Typography variant="body2" color="text.secondary">/</Typography>
                <Typography variant="body2" color="primary.main" fontWeight={600}>Groups</Typography>
              </Box>
            </Box>
            <ScrollableBox>
              {selectedSubGroup ? (
                <SubGroupModules subGroup={subGroups[selectedMainGroup]?.find(sg => sg._id === selectedSubGroup)} />
              ) : (
                <Box 
                  sx={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary'
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    Select a Subgroup
                  </Typography>
                  <Typography variant="body2">
                    Please select a subgroup from the left panel to view its modules.
                  </Typography>
                </Box>
              )}
            </ScrollableBox>
          </Paper>
        </Grid>
      </Grid>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <JoinGroupDialog
        open={joinDialogOpen}
        onClose={() => { setJoinDialogOpen(false); setJoinError(''); }}
        onJoin={handleJoinGroup}
        loading={joinLoading}
        error={joinError}
      />
    </Box>
  );
}
