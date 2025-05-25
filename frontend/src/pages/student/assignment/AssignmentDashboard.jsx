import React, { useState, useEffect } from 'react';
import { Box, Grid, useTheme, useMediaQuery, Paper, Typography, List, ListItem, ListItemText, Collapse, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions, Breadcrumbs, TextField, Alert, Chip, CardContent, InputAdornment, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import { IconButton, Tooltip } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AccessTime from '@mui/icons-material/AccessTime';
import AttachFile from '@mui/icons-material/AttachFile';
import Close from '@mui/icons-material/Close';
import GroupIcon from '@mui/icons-material/Group';
import School from '@mui/icons-material/School';
import Refresh from '@mui/icons-material/Refresh';
import Search from '@mui/icons-material/Search';
import Cancel from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Components
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import AssignmentSubmitModal from './components/AssignmentSubmitModal';
import SubmitButton from './components/SubmitButton';

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

const AssignmentDashboard = ({ subGroup: propSubGroup }) => {
  // State Management
  const [mainGroups, setMainGroups] = useState([]);
  const [subGroups, setSubGroups] = useState({});
  const [selectedMainGroup, setSelectedMainGroup] = useState(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState(propSubGroup?._id || null);
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submissionStats, setSubmissionStats] = useState({ total: 0, submitted: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Hooks and Context
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Prevent body scrolling
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Real-time polling for new assignments
  useEffect(() => {
    if (selectedSubGroup && selectedMainGroup) {
      // Initial fetch
      fetchAssignments(selectedSubGroup, selectedMainGroup);
      
      // Set up polling
      const pollInterval = setInterval(() => {
        fetchAssignments(selectedSubGroup, selectedMainGroup);
      }, 30000); // Poll every 30 seconds

      return () => clearInterval(pollInterval);
    }
  }, [selectedSubGroup, selectedMainGroup]);

  // Move fetchGroups out of useEffect and define it as a named async function
  const fetchGroups = async () => {
    setLoading(true);
    try {
      console.log('Fetching groups...');
      const response = await axios.get('/api/student/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Groups response:', response.data);
      setMainGroups(response.data);
      
      // If we have a propSubGroup, find its main group and set it
      if (propSubGroup) {
        const mainGroup = response.data.find(group => 
          group.subGroups?.some(sg => sg._id === propSubGroup._id)
        );
        if (mainGroup) {
          console.log('Found main group for propSubGroup:', mainGroup);
          setSelectedMainGroup(mainGroup._id);
          setSelectedSubGroup(propSubGroup._id);
          fetchAssignments(propSubGroup._id, mainGroup._id);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
      setLoading(false);
    }
  };

  // In useEffect, just call fetchGroups
  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line
  }, [token, propSubGroup]);

  // Fetch Assignments for Selected Subgroup
  const fetchAssignments = async (subGroupId, mainGroupId) => {
    if (!subGroupId || !mainGroupId) {
      console.error('Missing required parameters:', { subGroupId, mainGroupId });
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching assignments for subgroup:', subGroupId, 'in main group:', mainGroupId);
      const res = await axios.get(`/api/assignments/student/subgroup/${subGroupId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: { 
          mainGroup: mainGroupId 
        }
      });
      
      console.log('Assignments response:', res.data);
      if (Array.isArray(res.data)) {
        setAssignments(res.data);
        
        // Calculate submission stats using submissionStatus
        const total = res.data.length;
        const submitted = res.data.filter(a => a.submissionStatus === 'submitted').length;
        
        setSubmissionStats({ total, submitted });
      } else {
        console.error('Invalid response format:', res.data);
        toast.error('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('Error fetching assignments:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
        toast.error(error.response.data.message || 'Failed to fetch assignments');
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('No response from server. Please check your connection.');
      } else {
        console.error('Error setting up request:', error.message);
        toast.error('Failed to fetch assignments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Main Group Selection
  const handleMainGroupClick = async (mainGroupId) => {
    console.log('Selecting main group:', mainGroupId);
    setSelectedMainGroup(mainGroupId);
    setSelectedSubGroup(null);
    setAssignments([]);
    
    try {
      const res = await axios.get(`/api/student/groups/${mainGroupId}/subgroups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Subgroups response:', res.data);
      
      if (Array.isArray(res.data)) {
        setSubGroups(prev => ({ ...prev, [mainGroupId]: res.data }));
      } else {
        console.error('Invalid subgroups data:', res.data);
        toast.error('Invalid subgroups data received');
      }
    } catch (error) {
      console.error('Error fetching subgroups:', error);
      toast.error('Failed to fetch subgroups. Please try again.');
    }
  };

  // Handle Subgroup Selection
  const handleSubGroupClick = (mainGroupId, subGroupId) => {
    if (!mainGroupId || !subGroupId) {
      console.error('No main group ID or sub group ID provided');
      return;
    }
    console.log('Selecting subgroup:', subGroupId, 'from main group:', mainGroupId);
    setSelectedMainGroup(mainGroupId);
    setSelectedSubGroup(subGroupId);
    fetchAssignments(subGroupId, mainGroupId);
  };

  // Download All Assignments
  const handleDownloadAll = async () => {
    try {
      const response = await axios.get(`/api/assignments/${selectedSubGroup}/download-all`, {
        headers: { Authorization: `Bearer ${user.token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'assignments.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to download assignments');
    }
  };

  // Handle Assignment View
  const handleViewAssignment = (assignment) => {
    if (!assignment || !assignment._id) {
      toast.error('Assignment not found or invalid.');
      return;
    }
    navigate(`/student/assignment/${assignment._id}`);
  };

  // Handle Assignment Submit
  const handleSubmitAssignment = (assignment) => {
    // Check if already submitted and resubmission is not allowed
    if (assignment.submissionStatus === 'submitted' && !assignment.allowResubmission) {
      toast.error('You have already submitted this assignment and resubmission is not allowed');
      return;
    }

    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setSubmissionText('');
    setFiles([]);
    setSubmitError('');
  };

  const handleFileChange = (event) => {
    setFiles([...event.target.files]);
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      setSubmitError('Please provide submission notes');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('submissionText', submissionText);
      
      if (files.length > 0) {
        files.forEach((file) => {
          formData.append('files', file);
        });
      }

      console.log('Submitting assignment:', {
        assignmentId: selectedAssignment._id,
        submissionText,
        files: files.length
      });

      const response = await axios.post(
        `/api/assignments/student/submit/${selectedAssignment._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('Submission response:', response.data);

      // Update the assignments list with the updated assignment
      if (response.data.assignment) {
        setAssignments(prevAssignments => 
          prevAssignments.map(assignment => 
            assignment._id === response.data.assignment._id 
              ? response.data.assignment 
              : assignment
          )
        );

        // Update submission stats
        const total = assignments.length;
        const submitted = assignments.filter(a => a.submissionStatus === 'submitted').length;
        setSubmissionStats({ total, submitted });
      }

      toast.success(response.data.message || 'Assignment submitted successfully!');
      setShowSubmitModal(false);
      setSelectedAssignment(null);
      setSubmissionText('');
      setFiles([]);
      
      // Refresh assignments
      if (selectedSubGroup && selectedMainGroup) {
        await fetchAssignments(selectedSubGroup, selectedMainGroup);
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit assignment. Please try again.');
      toast.error(error.response?.data?.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter Assignments
  const filteredAssignments = assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExpandMainGroup = (mainGroupId) => {
    if (expandedGroups.includes(mainGroupId)) {
      setExpandedGroups(prev => prev.filter(id => id !== mainGroupId));
    } else {
      setExpandedGroups(prev => [...prev, mainGroupId]);
    }
  };

  // Helper function to get current group and subgroup names
  const getCurrentGroupNames = () => {
    if (!selectedMainGroup || !selectedSubGroup) return null;
    
    const mainGroup = mainGroups.find(g => g._id === selectedMainGroup);
    const subGroup = mainGroup?.subGroups?.find(sg => sg._id === selectedSubGroup);
    
    return {
      mainGroup: mainGroup?.name,
      subGroup: subGroup?.name
    };
  };

  return (
    <ThemeProvider theme={{}}>
      <Box sx={{ 
        width: '100vw',
        height: 'calc(100vh - 64px)',
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
          {/* Left Panel - Groups and Subgroups */}
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
            <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', minHeight: 0, border: '1px solid', borderColor: '#eee', p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <School color="primary" sx={{ mr: 1 }} /> My Groups
                </Typography>
                <Tooltip title="Refresh groups">
                  <IconButton onClick={fetchGroups} size="small" color="primary" sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}>
                    <Refresh />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                size="small"
                placeholder="Search groups..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')} edge="end" title="Clear search">
                        <Cancel fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ flexGrow: 1, overflow: 'auto', maxHeight: '100%', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: '#bdbdbd', borderRadius: '10px', '&:hover': { background: '#a5a5a5' } } }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <List sx={{ p: 1 }}>
                    {mainGroups.map((group) => (
                      <React.Fragment key={group._id}>
                        <ListItem
                          button
                          onClick={() => handleExpandMainGroup(group._id)}
                          selected={selectedMainGroup === group._id}
                          sx={{
                            borderRadius: '4px',
                            mb: 1,
                            border: '1px solid',
                            borderColor: selectedMainGroup === group._id ? '#333' : '#eee',
                            bgcolor: selectedMainGroup === group._id ? '#f5f5f5' : '#ffffff',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              bgcolor: '#fafafa',
                              borderColor: '#999',
                            },
                            '&.Mui-selected': {
                              bgcolor: '#f5f5f5',
                              '&:hover': {
                                bgcolor: '#f0f0f0',
                              },
                            },
                          }}
                        >
                          <ListItemText 
                            primary={group.name} 
                            primaryTypographyProps={{
                              fontWeight: selectedMainGroup === group._id ? 500 : 400,
                              color: '#333',
                            }}
                          />
                          {expandedGroups.includes(group._id) ? <ExpandLess /> : <ExpandMore />}
                        </ListItem>
                        <Collapse in={expandedGroups.includes(group._id)} timeout="auto" unmountOnExit>
                          <Box sx={{ pl: 2, pr: 1, pb: 1 }}>
                            <Grid container spacing={1}>
                              {group.subGroups && group.subGroups.map((subGroup) => (
                                <Grid item xs={6} key={subGroup._id}>
                                  <Paper
                                    elevation={0}
                                    sx={{
                                      p: 1,
                                      cursor: 'pointer',
                                      border: '1px solid',
                                      borderColor: selectedSubGroup === subGroup._id ? '#333' : '#eee',
                                      borderRadius: '4px',
                                      bgcolor: selectedSubGroup === subGroup._id ? '#f5f5f5' : '#ffffff',
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        bgcolor: '#fafafa',
                                        borderColor: '#999',
                                      },
                                    }}
                                    onClick={() => handleSubGroupClick(group._id, subGroup._id)}
                                  >
                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                      <GroupIcon fontSize="small" color={selectedSubGroup === subGroup._id ? 'inherit' : 'primary'} sx={{ mr: 0.5 }} />
                                      <Typography 
                                        variant="body2"
                                        fontWeight={selectedSubGroup === subGroup._id ? 600 : 500}
                                        color={selectedSubGroup === subGroup._id ? 'white' : 'text.primary'}
                                        align="center"
                                        noWrap
                                      >
                                        {subGroup.name}
                                      </Typography>
                                    </CardContent>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        </Collapse>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Right Panel - Assignments */}
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
                bgcolor: '#fff',
                minHeight: 0,
                border: '1px solid',
                borderColor: '#eee',
                p: 2.5
              }}
            >
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    Assignments
                  </Typography>
                </Box>
                <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                  View and manage your assignment tasks and deadlines.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Tooltip title="Dashboard"><IconButton size="small" onClick={() => navigate('/student/dashboard')}><School color="primary" /></IconButton></Tooltip>
                  <Typography variant="body2" color="text.secondary">/</Typography>
                  <Typography variant="body2" color="primary.main" fontWeight={600}>Assignments</Typography>
                </Box>
              </Box>
              {selectedSubGroup ? (
                <>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    borderBottom: '1px solid',
                    borderColor: '#eee',
                    bgcolor: '#ffffff',
                    flexShrink: 0
                  }}>
                    {/* Left side: Navigation and Title */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      gap: { xs: 1, sm: 2 }
                    }}>
                      <Breadcrumbs 
                        separator={<NavigateNextIcon fontSize="small" sx={{ color: '#999' }} />}
                        aria-label="group navigation"
                        sx={{
                          '& .MuiBreadcrumbs-ol': {
                            flexWrap: 'nowrap'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FolderIcon sx={{ fontSize: 18, color: '#666' }} />
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: '#666',
                              fontWeight: 500,
                              cursor: 'pointer',
                              '&:hover': {
                                color: '#333'
                              }
                            }}
                            onClick={() => {
                              setSelectedMainGroup(null);
                              setSelectedSubGroup(null);
                            }}
                          >
                            Groups
                          </Typography>
                        </Box>
                        {getCurrentGroupNames() && (
                          <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <FolderOpenIcon sx={{ fontSize: 18, color: '#666' }} />
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  color: '#666',
                                  fontWeight: 500,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    color: '#333'
                                  }
                                }}
                                onClick={() => {
                                  setSelectedSubGroup(null);
                                }}
                              >
                                {getCurrentGroupNames().mainGroup}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <FolderOpenIcon sx={{ fontSize: 18, color: '#333' }} />
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  color: '#333',
                                  fontWeight: 500
                                }}
                              >
                                {getCurrentGroupNames().subGroup}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Breadcrumbs>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 500, 
                          color: '#333',
                          borderLeft: '1px solid',
                          borderColor: '#eee',
                          pl: 2,
                          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                        }}
                      >
                        Assignments
                      </Typography>
                    </Box>

                    {/* Right side: Stats */}
                    <Box sx={{ flexShrink: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#666',
                          bgcolor: '#f5f5f5',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontWeight: 400,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Submitted: {submissionStats.submitted} / {submissionStats.total}
                      </Typography>
                    </Box>
                  </Box>

                  <ScrollableBox>
                    <Box sx={{ p: 1.5 }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                          <CircularProgress />
                        </Box>
                      ) : assignments.length > 0 ? (
                        <List>
                          {assignments.map((assignment) => (
                            <ListItem
                              key={assignment._id}
                              sx={{
                                mb: 2,
                                border: '1px solid',
                                borderColor: '#eee',
                                borderRadius: '4px',
                                bgcolor: '#ffffff',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  bgcolor: '#fafafa',
                                  transform: 'translateY(-1px)',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                },
                              }}
                            >
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="h6">{assignment.title}</Typography>
                                      {assignment.submissionStatus === 'submitted' && (
                                        <Chip 
                                          label={assignment.allowResubmission ? 'Submitted (Can Resubmit)' : 'Submitted'}
                                          color="success"
                                          size="small"
                                          sx={{ ml: 1 }}
                                        />
                                      )}
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <SubmitButton 
                                        assignment={assignment}
                                        onSubmit={handleSubmitAssignment}
                                      />
                                    </Box>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {assignment.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <AccessTime sx={{ fontSize: 16, mr: 0.5, color: new Date(assignment.deadline) < new Date() ? '#f57c00' : 'inherit' }} />
                                        <Typography 
                                          variant="caption" 
                                          color={new Date(assignment.deadline) < new Date() ? '#f57c00' : 'text.secondary'}
                                        >
                                          Due: {new Date(assignment.deadline).toLocaleString()}
                                          {new Date(assignment.deadline) < new Date() && ' (Late)'}
                                        </Typography>
                                      </Box>
                                      {assignment.submissions && assignment.submissions.some(s => s.student && s.student._id === user._id) && (
                                        <Typography variant="caption" color="text.secondary">
                                          Status: {assignment.submissions.find(s => s.student && s.student._id === user._id)?.isLate ? 'Late Submission' : 'Submitted'}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ textAlign: 'center', p: 3 }}>
                          <Typography color="#666">
                            No assignments available for this subgroup
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </ScrollableBox>
                </>
              ) : (
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <Typography 
                    color="#666"
                    variant="h6"
                    sx={{ 
                      fontWeight: 400,
                      fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    Select a subgroup to view assignments
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Submit Modal */}
        <Dialog
          open={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '4px',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }
          }}
        >
          <DialogTitle>
            Submit Assignment
            <IconButton
              aria-label="close"
              onClick={() => setShowSubmitModal(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {submitError}
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {selectedAssignment?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedAssignment?.description}
              </Typography>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              label="Submission Notes"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              sx={{ mb: 2 }}
              required
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<AttachFile />}
              sx={{ mb: 1 }}
            >
              Upload Files
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileChange}
              />
            </Button>

            {files.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {files.length} file(s) selected
              </Typography>
            )}

            {submitting && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
              sx={{ 
                borderRadius: '4px',
                textTransform: 'none',
                color: '#666',
                '&:hover': {
                  bgcolor: '#f5f5f5',
                }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ 
                borderRadius: '4px',
                textTransform: 'none',
                bgcolor: '#333',
                '&:hover': {
                  bgcolor: '#444',
                }
              }}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
};

export default AssignmentDashboard;