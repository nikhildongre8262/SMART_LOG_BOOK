import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography, List, ListItem, ListItemButton, ListItemText, Divider, Button, Collapse, Paper, CircularProgress, IconButton, Grid, Chip, Fade, Fab, Accordion, AccordionSummary, AccordionDetails, Avatar, Breadcrumbs, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, LinearProgress, InputAdornment, Select, MenuItem, FormControl, Tooltip, Stack, Card, CardContent, CardActions } from '@mui/material';
import { ExpandLess, ExpandMore, AddCircle, Edit, Delete, Visibility, Group as GroupIcon, School, Category, Refresh, Sort, FilterList, InsertDriveFile, AssignmentTurnedIn, Event, Share, AccessTime, Dashboard as DashboardIcon, Search } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import AssignmentForm from '../../../components/AssignmentForm.js';
import AdminNavbar from '../../../components/AdminNavbar';
import AdminSidebar from '../../../components/AdminSidebar';
import SubmissionList from '../../../components/SubmissionList';
import AdminAssignmentCard from './components/AdminAssignmentCard';
import { ToastContainer, toast } from 'react-toastify';
import { notifySuccess } from '../../../utils/notify';
import 'react-toastify/dist/ReactToastify.css';

const AssignmentDashboard = () => {
  const [mainGroups, setMainGroups] = useState([]);
  const [expandedMainGroup, setExpandedMainGroup] = useState(null);
  const [subGroups, setSubGroups] = useState({});
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [formLoading, setFormLoading] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Add loading state for main groups
  const [mainGroupsLoading, setMainGroupsLoading] = useState(false);

  // Add refresh loading state
  const [refreshingGroups, setRefreshingGroups] = useState(false);

  // Add state for search, sort, filters, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [totalPages, setTotalPages] = useState(1);

  // Add state for view dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDialogAssignment, setViewDialogAssignment] = useState(null);

  // Prevent body and root from scrolling
  useEffect(() => {
    document.documentElement.style.height = '100vh';
    document.body.style.height = '100vh';
    document.body.style.overflow = 'hidden';
    const root = document.getElementById('root');
    if (root) {
      root.style.height = '100vh';
      root.style.overflow = 'hidden';
    }
    return () => {
      document.documentElement.style.height = '';
      document.body.style.height = '';
      document.body.style.overflow = '';
      if (root) {
        root.style.height = '';
        root.style.overflow = '';
      }
    };
  }, []);

  // Fetch main groups on mount with better error handling
  useEffect(() => {
    const fetchMainGroups = async () => {
      setMainGroupsLoading(true);
      try {
        const res = await axios.get('/api/groups', { headers: { Authorization: `Bearer ${token}` } });
        setMainGroups(res.data);
        // Restore last selected subgroup and fetch assignments
        const lastSubGroup = JSON.parse(localStorage.getItem('lastSelectedSubGroup'));
        if (lastSubGroup && lastSubGroup._id) {
          setSelectedSubGroup(lastSubGroup);
          setLoading(true);
          try {
            const res2 = await axios.get(`/api/assignments/subgroup/${lastSubGroup._id}`, { headers: { Authorization: `Bearer ${token}` } });
            setAssignments(res2.data);
          } catch (err) {
            console.error('Failed to fetch assignments, using mock data instead', err);
            setAssignments(generateMockAssignments(lastSubGroup._id));
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching main groups:', err);
        toast.error('Failed to fetch groups. Please try again later.');
        setMainGroups([]);
      } finally {
        setMainGroupsLoading(false);
      }
    };
    fetchMainGroups();
  }, [token]);

  // Add loading state for subgroups
  const [subGroupsLoading, setSubGroupsLoading] = useState({});

  // Fetch sub-groups for a main group with better error handling
  const handleExpandMainGroup = async (mainGroupId) => {
    setExpandedMainGroup(expandedMainGroup === mainGroupId ? null : mainGroupId);
    setSelectedSubGroup(null);
    setAssignments([]);
    
    // Always fetch subgroups when expanding a group
    setSubGroupsLoading(prev => ({ ...prev, [mainGroupId]: true }));
    try {
      const res = await axios.get(`/api/groups/${mainGroupId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      console.log('Fetched group data:', res.data); // Debug log
      setSubGroups(prev => ({ ...prev, [mainGroupId]: res.data.subGroups || [] }));
    } catch (error) {
      console.error('Error fetching subgroups:', error);
      toast.error('Failed to fetch subgroups. Please try again later.');
      setSubGroups(prev => ({ ...prev, [mainGroupId]: [] }));
    } finally {
      setSubGroupsLoading(prev => ({ ...prev, [mainGroupId]: false }));
    }
  };

  // Add loading state for assignments
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);

  // Fetch assignments for a sub-group with better error handling
  const handleSelectSubGroup = async (mainGroupId, subGroup) => {
    console.log('[DEBUG] Selecting subgroup:', subGroup._id);
    setSelectedSubGroup(subGroup);
    localStorage.setItem('lastSelectedSubGroup', JSON.stringify(subGroup));
    setAssignments([]);
    setAssignmentsLoading(true);
    
    try {
      console.log('[DEBUG] Fetching assignments for subgroup:', subGroup._id);
      const res = await axios.get(`/api/assignments/subgroup/${subGroup._id}`, { 
        headers: { Authorization: `Bearer ${token}` },
        params: { mainGroup: mainGroupId }
      });
      
      console.log('[DEBUG] Assignments received:', res.data.length);
      
      // Ensure assignments have proper group references
      const assignmentsWithGroups = res.data.map(assignment => ({
        ...assignment,
        mainGroup: { _id: mainGroupId, name: mainGroups.find(g => g._id === mainGroupId)?.name },
        subGroup: subGroup
      }));
      
      setAssignments(assignmentsWithGroups);
    } catch (error) {
      console.error('[DEBUG] Error fetching assignments:', error);
      if (error.response) {
        toast.error(error.response.data.message || 'Failed to fetch assignments');
      } else {
        toast.error('Network error while fetching assignments');
      }
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const onSubmit = async (values) => {
    try {
      setFormLoading(true);
      console.log('[DEBUG] Submitting assignment:', values);
      
      const response = await axios.post('/api/assignments', {
        ...values,
        mainGroup: expandedMainGroup,
        subGroup: selectedSubGroup._id
      });
      
      // Update assignments state by adding the new assignment to the array
      setAssignments(prev => {
        console.log('[DEBUG] Current assignments:', prev);
        return [response.data, ...prev]; // New assignment added to beginning
      });
      
      notifySuccess('Assignment created successfully!');
      setShowForm(false);
      
      // Auto-scroll to top to show new assignment
      const container = document.querySelector('.assignments-container');
      if (container) container.scrollTop = 0;
      
    } catch (error) {
      console.error('[ERROR] Assignment creation failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setFormLoading(false);
    }
  };

  // Add delete confirmation and error handling
  const handleDeleteAssignment = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/assignments/${assignmentId}`, { headers: { Authorization: `Bearer ${token}` } });
        const res = await axios.get(`/api/assignments/subgroup/${selectedSubGroup._id}`, { headers: { Authorization: `Bearer ${token}` } });
        setAssignments(res.data);
        toast.success('Assignment deleted successfully');
      } catch (error) {
        console.error('Error deleting assignment:', error);
        toast.error('Failed to delete assignment. Please try again later.');
      }
    }
  };

  // Add handler functions for assignment card buttons
  const handleViewSubmissions = (assignment) => {
    console.log('View submissions for:', assignment._id);
    setSelectedAssignment(assignment);
    setShowSubmissions(true);
  };

  const handleEditAssignment = (assignment) => {
    console.log('Edit assignment:', assignment._id);
    setEditAssignment(assignment);
    setShowForm(true);
  };

  const handleDeleteAssignmentCard = async (assignment) => {
    if (!window.confirm(`Are you sure you want to delete assignment "${assignment.title}"?`)) return;
    
    try {
      await axios.delete(`/api/assignments/${assignment._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      notifySuccess('Assignment deleted successfully');
      setRefreshFlag(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleDownloadAll = async (assignment) => {
    try {
      toast.info('Fetching submissions data...');
      
      // 1. Fetch submissions data
      const response = await axios.get(
        `/api/assignments/${assignment._id}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // 2. Prepare Excel data
      const submissions = response.data || [];
      const excelData = submissions.map(sub => ({
        'Student Name': sub.student?.name || 'Unknown',
        'Student ID': sub.student?.id || '',
        'Submission Date': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'Not submitted',
        'Status': sub.status || 'Pending',
        'Grade': sub.grade || '',
        'Feedback': sub.feedback || ''
      }));

      // 3. Import SheetJS dynamically to reduce bundle size
      const XLSX = await import('xlsx');
      
      // 4. Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(wb, ws, 'Submissions');
      
      // 5. Generate Excel file and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assignment.title.replace(/[^\w\s]/gi, '')}_submissions.xlsx`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 60000);
      
      toast.success('Excel file downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download submissions');
    }
  };

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    mainGroup: '',
    subGroup: '',
    allowLateSubmission: false,
    allowResubmission: false
  });

  const handleCreateAssignment = async () => {
    try {
      const response = await axios.post('/api/assignments', formData);
      setAssignments([...assignments, response.data]);
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        deadline: '',
        mainGroup: '',
        subGroup: '',
        allowLateSubmission: false,
        allowResubmission: false
      });
      toast.success('Assignment created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleEditAssignmentDialog = async () => {
    try {
      const response = await axios.put(`/api/assignments/${editingAssignment._id}`, formData);
      setAssignments(assignments.map(a => a._id === editingAssignment._id ? response.data : a));
      setShowEditDialog(false);
      setEditingAssignment(null);
      toast.success('Assignment updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignment');
    }
  };

  // Refresh groups handler
  const handleRefreshGroups = async () => {
    setRefreshingGroups(true);
    try {
      const res = await axios.get('/api/groups', { headers: { Authorization: `Bearer ${token}` } });
      setMainGroups(res.data);
      toast.success('Groups refreshed');
    } catch (err) {
      toast.error('Failed to refresh groups');
    } finally {
      setRefreshingGroups(false);
    }
  };

  // Filter and sort assignments when assignments, searchQuery, or sortOption changes
  const filteredAssignments = useMemo(() => {
    if (!selectedSubGroup) return [];
    
    return assignments.filter(assignment => {
      const matchesSubGroup = assignment.subGroup?._id === selectedSubGroup._id;
      const matchesMainGroup = assignment.mainGroup?._id === expandedMainGroup;
      
      if (!matchesSubGroup || !matchesMainGroup) return false;
      
      // Additional filtering logic if needed
      return true;
    });
  }, [assignments, selectedSubGroup, expandedMainGroup]);

  useEffect(() => {
    let filtered = filteredAssignments.filter(a =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (sortOption === 'newest') {
      filtered = filtered.sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
    } else if (sortOption === 'oldest') {
      filtered = filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortOption === 'a-z') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'z-a') {
      filtered = filtered.sort((a, b) => b.title.localeCompare(a.title));
    }
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setPage(1);
  }, [assignments, searchQuery, sortOption]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSortChange = (e) => setSortOption(e.target.value);
  const handlePageChange = (e, value) => setPage(value);

  // Assignment stats (total, by type if possible)
  const assignmentStats = {
    total: filteredAssignments.length,
    withFiles: filteredAssignments.filter(a => a.files && a.files.length > 0).length,
    withoutFiles: filteredAssignments.filter(a => !a.files || a.files.length === 0).length,
  };

  // Helper function for deadline indicator
  function getDeadlineIndicator(deadline) {
    if (!deadline) return { label: 'No deadline', color: 'grey.500' };
    const now = new Date();
    const due = new Date(deadline);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24)); // days
    if (diff < 0) return { label: 'Overdue', color: 'error.main' };
    if (diff === 0) return { label: 'Due today', color: 'error.main' };
    if (diff === 1) return { label: 'Due in 1 day', color: 'error.main' };
    if (diff <= 2) return { label: `Due in ${diff} days`, color: 'error.main' };
    if (diff <= 7) return { label: `Due in ${diff} days`, color: 'warning.main' };
    return { label: `Due in ${diff} days`, color: 'success.main' };
  }

  const [feedbackText, setFeedbackText] = useState('');

  const handleApprove = async (submissionId) => {
    try {
      setLoading(true);
      const res = await axios.post(
        `/api/assignments/submissions/${submissionId}/approve`,
        { feedback: feedbackText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Approval successful:', res.data);
      
      // Refresh submissions with optimistic update
      setSubmissions(prev => prev.map(sub => 
        sub._id === submissionId ? { 
          ...sub, 
          status: 'approved',
          approvalStatus: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: token
        } : sub
      ));

      toast.success('Submission approved successfully');
    } catch (error) {
      console.error('Approval failed:', error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || 'Failed to approve submission', 
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
      setFeedbackText('');
    }
  };

  const generateMockAssignments = (subgroupId) => {
    return Array.from({ length: 5 }, (_, i) => ({
      _id: `mock-assignment-${subgroupId}-${i}`,
      title: `Mock Assignment ${i + 1}`,
      description: `This is a mock assignment for testing purposes`,
      dueDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000)).toISOString(),
      submissions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <AdminNavbar />
      <AdminSidebar selected="assignments" />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
        <Box sx={{ flex: 1, p: 3, ml: '220px', width: '100%', mt: '64px' }}>
          {/* Header Section */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">Assignments Management</Typography>
              <Breadcrumbs aria-label="breadcrumb">
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} 
                  onClick={() => navigate('/admin')}
                >
                  Dashboard
                </Typography>
                <Typography variant="body2" color="text.primary" fontWeight={500}>
                  Assignments
                </Typography>
                {expandedMainGroup && mainGroups.length > 0 && (
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    {mainGroups.find(g => g._id === expandedMainGroup)?.name || 'Group'}
                  </Typography>
                )}
                {selectedSubGroup && (
                  <Typography variant="body2" color="primary.dark" fontWeight={700}>
                    {selectedSubGroup.name}
                  </Typography>
                )}
              </Breadcrumbs>
            </Box>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 2, 
                borderRadius: 2, 
                border: '1px solid', 
                borderColor: 'divider', 
                bgcolor: '#f8faff',
                mb: 3 
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Manage your assignments across groups and subgroups. Add new assignments, organize by deadlines, and keep your coursework up to date.
              </Typography>
            </Paper>
          </Box>
          <Grid container spacing={3}>
            {/* Groups & Subgroups Panel */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  maxHeight: '85vh', 
                  overflowY: 'auto',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ height: '100%', overflowY: 'auto', pr: 1, minHeight: 0, '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '10px' }, '&::-webkit-scrollbar-thumb': { background: '#bdbdbd', borderRadius: '10px', '&:hover': { background: '#a5a5a5' } } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School fontSize="small" /> Groups & Subgroups
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={handleRefreshGroups}
                      color="primary"
                      sx={{ bgcolor: 'primary.lighter' }}
                      disabled={refreshingGroups}
                    >
                      <Refresh fontSize="small" />
                    </IconButton>
                  </Box>
                  {mainGroupsLoading || refreshingGroups ? <LinearProgress sx={{ mb: 2 }} /> : null}
                  {/* No groups message */}
                  {!mainGroupsLoading && !refreshingGroups && mainGroups.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                      <Avatar sx={{ mx: 'auto', mb: 2, width: 70, height: 70, bgcolor: 'primary.lighter' }}>
                        <School sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
                        No Groups Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        You haven't created any groups yet. Groups are needed to organize your assignments.
                      </Typography>
                    </Box>
                  )}
                  {/* Groups List */}
                  <Box>
                    {mainGroups.map(mainGroup => (
                      <Accordion
                        key={mainGroup._id}
                        expanded={expandedMainGroup === mainGroup._id}
                        onChange={() => handleExpandMainGroup(mainGroup._id)}
                        elevation={0}
                        disableGutters
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: expandedMainGroup === mainGroup._id ? 'primary.main' : 'divider',
                          overflow: 'hidden',
                          background: expandedMainGroup === mainGroup._id ? 'primary.lighter' : '#fff',
                          transition: 'all 0.3s',
                          '&:before': { display: 'none' },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMore color={expandedMainGroup === mainGroup._id ? 'primary' : 'action'} />}
                          aria-controls={`panel-${mainGroup._id}-content`}
                          id={`panel-${mainGroup._id}-header`}
                          sx={{
                            minHeight: '54px',
                            borderRadius: 2,
                            '& .MuiAccordionSummary-content': { alignItems: 'center' },
                          }}
                        >
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar 
                              sx={{ 
                                bgcolor: expandedMainGroup === mainGroup._id ? 'primary.main' : 'primary.lighter', 
                                width: 36, 
                                height: 36, 
                                fontSize: 16,
                                color: expandedMainGroup === mainGroup._id ? 'white' : 'primary.main'
                              }}
                            >
                              {mainGroup.name[0].toUpperCase()}
                            </Avatar>
                            <Typography 
                              variant="subtitle1" 
                              fontWeight={600}
                              color={expandedMainGroup === mainGroup._id ? 'primary.main' : 'text.primary'}
                            >
                              {mainGroup.name}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 2, pt: 0 }}>
                          <Divider sx={{ mb: 2, mt: 1 }} />
                          {/* Sub-group section */}
                          {subGroupsLoading[mainGroup._id] ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : (subGroups[mainGroup._id] || []).length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                              No subgroups available in this group
                            </Typography>
                          ) : (
                            <Box>
                              <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
                                Select a subgroup to view its assignments:
                              </Typography>
                              <Grid container spacing={1.5} sx={{ mt: 1 }}>
                                {(subGroups[mainGroup._id] || []).map(subGroup => (
                                  <Grid item xs={6} key={subGroup._id}>
                                    <Button
                                      variant={selectedSubGroup && selectedSubGroup._id === subGroup._id ? 'contained' : 'outlined'}
                                      color="primary"
                                      size="small"
                                      fullWidth
                                      onClick={() => handleSelectSubGroup(mainGroup._id, subGroup)}
                                      sx={{ 
                                        py: 1,
                                        borderRadius: 1,
                                        textTransform: 'none',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <Category fontSize="small" sx={{ mb: 0.5 }} />
                                      {subGroup.name}
                                    </Button>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
            {/* Assignments Display Panel */}
            <Grid item xs={12} md={8}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 3, 
                  minHeight: 550,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <Box sx={{ mb: 3 }}>
                  {selectedSubGroup ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category fontSize="small" /> {selectedSubGroup.name} Assignments
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, position: 'relative', zIndex: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<AddCircle />}
                          onClick={() => {
                            console.log('[DEBUG] Add Assignment button clicked');
                            setShowForm(true);
                            setEditAssignment(null);
                          }}
                          sx={{ borderRadius: 2, px: 3 }}
                        >
                          Add Assignment
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Category fontSize="small" /> Assignments
                    </Typography>
                  )}
                </Box>
                {/* Search and Filters Section (only show when subgroup is selected) */}
                {selectedSubGroup && (
                  <Box sx={{ mb: 3 }}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        mb: 2,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        {/* Search */}
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            placeholder="Search assignments..."
                            size="small"
                            onChange={handleSearchChange}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Search fontSize="small" color="action" />
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        {/* Sort Options */}
                        <Grid item xs={6} sm={3}>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={sortOption}
                              onChange={handleSortChange}
                              displayEmpty
                              startAdornment={
                                <InputAdornment position="start">
                                  <Sort fontSize="small" color="action" />
                                </InputAdornment>
                              }
                            >
                              <MenuItem value="newest">Newest First</MenuItem>
                              <MenuItem value="oldest">Oldest First</MenuItem>
                              <MenuItem value="a-z">A-Z</MenuItem>
                              <MenuItem value="z-a">Z-A</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        {/* Filter Button */}
                        <Grid item xs={6} sm={3}>
                          <Button 
                            variant={showFilters ? "contained" : "outlined"}
                            fullWidth 
                            startIcon={<FilterList />}
                            onClick={() => setShowFilters(!showFilters)}
                            size="small"
                          >
                            Filters
                          </Button>
                        </Grid>
                      </Grid>
                      {/* Expanded Filters */}
                      <Collapse in={showFilters}>
                        {/* ...filter controls if needed... */}
                      </Collapse>
                    </Paper>
                  </Box>
                )}
                {/* Assignment Content Area */}
                {!selectedSubGroup ? (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flex: 1, 
                      py: 6,
                      height: 'calc(100vh - 300px)'
                    }}>
                      {/* No subgroup selected content */}
                    </Box>
                  </Grid>
                ) : (
                  <Box sx={{
                    flex: 1,
                    minHeight: 'calc(100vh - 200px)', 
                    maxHeight: 'calc(100vh - 200px)', 
                    overflowY: 'auto',
                    pr: 1,
                    pb: '300px', // Increased to 300px (1.5 card heights)
                    scrollbarWidth: 'thin',
                    scrollbarColor: theme => `${theme.palette.primary.main} ${theme.palette.grey[200]}`,
                    '&::-webkit-scrollbar': {
                      width: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: theme => theme.palette.grey[200],
                      borderRadius: '10px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: theme => theme.palette.primary.main,
                      borderRadius: '10px',
                      border: '2px solid',
                      borderColor: theme => theme.palette.grey[200],
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: theme => theme.palette.primary.dark,
                    }
                  }} className="assignments-container">
                    <Grid container spacing={3} sx={{ mt: 2 }}>
                      {filteredAssignments.map((assignment) => (
                        <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                          <AdminAssignmentCard
                            assignment={assignment}
                            onEdit={() => handleEditAssignment(assignment)}
                            onDelete={() => handleDeleteAssignment(assignment)}
                            onViewSubmissions={() => handleViewSubmissions(assignment)}
                            onDownloadAll={() => handleDownloadAll(assignment)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
                {/* Remove pagination section since we're showing all assignments */}
                {/* The scrollable container will handle overflow */}
              </Paper>
            </Grid>
          </Grid>
          {/* Submission List Dialog */}
          {selectedAssignment && (
            <SubmissionList
              assignment={selectedAssignment}
              open={showSubmissions}
              onClose={() => setShowSubmissions(false)}
              addNotification={(message) => toast.success(message)}
              handleApprove={handleApprove}
            />
          )}
          {/* Assignment Form */}
          <Grid item xs={12}>
            <AssignmentForm
              open={showForm}
              onClose={() => {
                console.log('[DEBUG] Form closing');
                setShowForm(false);
                setEditAssignment(null);
              }}
              loading={formLoading}
              initialValues={editAssignment}
              onSubmit={onSubmit}
              mainGroupName={mainGroups.find(g => g._id === expandedMainGroup)?.name || ''}
              subGroupName={selectedSubGroup?.name || ''}
            />
          </Grid>
        </Box>
      </Box>
    </>
  );
}

export default AssignmentDashboard;
