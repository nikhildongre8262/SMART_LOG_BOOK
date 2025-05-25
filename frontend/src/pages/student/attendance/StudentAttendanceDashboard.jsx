import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  IconButton,
  Collapse,
  Tooltip,
  LinearProgress,
  Divider,
  Badge,
  Card,
  CardContent,
  Avatar,
  TextField,
  InputAdornment,
  Stack,
  Button,
} from '@mui/material';
import { 
  ExpandMore, 
  ExpandLess,
  Refresh, 
  CheckCircle,
  Cancel,
  CalendarMonth,
  Timeline,
  School,
  EventNote,
  AccessTime,
  Person,
  Search,
  FilterList,
  Today,
  EventBusy,
  Group,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import StudentNavbar from '../../../components/StudentNavbar.js';

// Styled components for better UI
const StatsCard = styled(Box)(({ theme, color }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: color,
  color: theme.palette.getContrastText(color),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 10px rgba(0,0,0,0.15)'
  }
}));

const StatusBadge = styled(Box)(({ theme, status }) => ({
  padding: theme.spacing(0.5, 1.5),
  borderRadius: 14,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 14,
  fontWeight: 500,
  backgroundColor: status ? theme.palette.success.light : theme.palette.error.light,
  color: status ? theme.palette.success.contrastText : theme.palette.error.contrastText
}));

const AttendanceRow = styled(TableRow)(({ theme, status }) => ({
  backgroundColor: status ? 'rgba(76, 175, 80, 0.04)' : 'rgba(244, 67, 54, 0.04)',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: status ? 'rgba(76, 175, 80, 0.08)' : 'rgba(244, 67, 54, 0.08)'
  }
}));

const StudentAttendanceDashboard = () => {
  const [mainGroups, setMainGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedMainGroup, setExpandedMainGroup] = useState(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    totalLectures: 0,
    present: 0,
    absent: 0,
    percentage: 0
  });
  const [todayStats, setTodayStats] = useState({
    total: 0,
    present: 0,
    absent: 0
  });
  
  const { user, token } = useAuth();

  useEffect(() => {
    fetchStudentGroups();
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredGroups(mainGroups);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = mainGroups.filter(group => {
      // Check if group name matches
      if (group.name.toLowerCase().includes(query)) return true;
      
      // Check if any subgroup name matches
      if (group.subGroups && group.subGroups.length > 0) {
        return group.subGroups.some(subgroup => 
          subgroup.name.toLowerCase().includes(query)
        );
      }
      
      return false;
    });
    
    setFilteredGroups(filtered);
  }, [searchQuery, mainGroups]);

  const fetchStudentGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMainGroups(res.data);
      setFilteredGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
    setLoading(false);
  };
  
  // Fetch today's attendance across all groups
  const fetchTodayAttendance = async () => {
    setOverviewLoading(true);
    try {
      const userId = user?.id || user?._id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // First ensure we have groups loaded
      let groups = mainGroups;
      if (groups.length === 0) {
        try {
          // Fetch groups if not already loaded
          const groupsRes = await axios.get('/api/student/groups', {
            headers: { Authorization: `Bearer ${token}` }
          });
          groups = groupsRes.data;
        } catch (err) {
          console.error('Error fetching groups for matching:', err);
        }
      }
      
      // Get all attendance records for the current student
      const res = await axios.get('/api/student/attendance', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data && Array.isArray(res.data)) {
        // Filter for today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const todayRecords = res.data.filter(session => {
          const sessionDate = new Date(session.date);
          sessionDate.setHours(0, 0, 0, 0); // Start of session date
          return sessionDate.getTime() === today.getTime();
        });
        
        console.log('Today\'s attendance records (all):', todayRecords.length);
        
        // Process each attendance record to find the student's status
        const processedTodayRecords = [];
        let presentCount = 0;
        let absentCount = 0;
        
        todayRecords.forEach(session => {
          if (session.records && Array.isArray(session.records)) {
            // Find this student's record
            const studentRecord = session.records.find(record => {
              const recordStudentId = 
                (typeof record.studentId === 'object') ? record.studentId?._id : record.studentId;
              return recordStudentId === userId;
            });
            
            if (studentRecord) {
              // Get group and subgroup info - try multiple approaches
              let groupName = 'Unknown Group';
              let subgroupName = 'Unknown Subgroup';
              
              // Try to find matching group and subgroup names
              // Approach 1: Use the groupId and subGroupId from the session
              if (session.groupId) {
                const groupId = typeof session.groupId === 'object' ? session.groupId._id : session.groupId;
                const subGroupId = typeof session.subGroupId === 'object' ? session.subGroupId._id : session.subGroupId;
                
                // Find matching group in our loaded groups
                const matchingGroup = groups.find(g => g._id === groupId);
                if (matchingGroup) {
                  groupName = matchingGroup.name;
                  
                  // Find the subgroup
                  if (matchingGroup.subGroups) {
                    const matchingSubgroup = matchingGroup.subGroups.find(sg => sg._id === subGroupId);
                    if (matchingSubgroup) {
                      subgroupName = matchingSubgroup.name;
                    }
                  }
                }
              }
              
              // Approach 2: Try to get names directly from session if they exist
              if (groupName === 'Unknown Group' && session.groupName) {
                groupName = session.groupName;
              }
              
              if (subgroupName === 'Unknown Subgroup' && session.subGroupName) {
                subgroupName = session.subGroupName;
              }
              
              // Approach 3: Use group property if it exists
              if (groupName === 'Unknown Group' && session.group) {
                if (typeof session.group === 'object') {
                  groupName = session.group.name || groupName;
                } else if (typeof session.group === 'string') {
                  groupName = session.group;
                }
              }
              
              // Approach 4: Use subgroup property if it exists
              if (subgroupName === 'Unknown Subgroup' && session.subGroup) {
                if (typeof session.subGroup === 'object') {
                  subgroupName = session.subGroup.name || subgroupName;
                } else if (typeof session.subGroup === 'string') {
                  subgroupName = session.subGroup;
                }
              }
              
              // Add the processed record
              processedTodayRecords.push({
                _id: session._id,
                date: session.date,
                status: studentRecord.present,
                topic: session.subject || 'Regular Class',
                notes: session.remarks || '',
                comments: '',
                markedBy: { 
                  name: session.createdBy?.name || 'Admin'
                },
                lectureNo: session.lectureNo?.toString() || '1',
                day: session.day || new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' }),
                group: groupName,
                subgroup: subgroupName
              });
              
              // Update stats
              if (studentRecord.present) {
                presentCount++;
              } else {
                absentCount++;
              }
            }
          }
        });
        
        console.log('Today\'s processed attendance records:', processedTodayRecords);
        
        // Sort records by date (newest first)
        processedTodayRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Update today's attendance and stats
        setTodayAttendance(processedTodayRecords);
        setTodayStats({
          total: processedTodayRecords.length,
          present: presentCount,
          absent: absentCount
        });
      } else {
        // Handle case where API returns no data
        setTodayAttendance([]);
        setTodayStats({ total: 0, present: 0, absent: 0 });
        createMockTodayAttendance(); // Generate mock data for better UX
      }
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
      setTodayAttendance([]);
      setTodayStats({ total: 0, present: 0, absent: 0 });
      createMockTodayAttendance(); // Generate mock data for error cases
    } finally {
      setOverviewLoading(false);
    }
  };
  
  // Create mock attendance data for today (for better UX when API fails)
  const createMockTodayAttendance = () => {
    // Only create mock data in development mode or if explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !process.env.REACT_APP_ENABLE_MOCK_DATA) {
      return;
    }
    
    console.log('Creating mock attendance data for today');
    
    const mockClasses = [
      { subject: 'Mathematics', group: 'Science Group', subgroup: 'Math 101' },
      { subject: 'Computer Science', group: 'Technology', subgroup: 'Programming Basics' },
      { subject: 'Physics', group: 'Science Group', subgroup: 'Physics Lab' },
      { subject: 'English Literature', group: 'Humanities', subgroup: 'Creative Writing' }
    ];
    
    const today = new Date();
    const mockRecords = [];
    let presentCount = 0;
    let absentCount = 0;
    
    // Generate 2-4 classes for today
    const numClasses = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < numClasses; i++) {
      const mockClass = mockClasses[i % mockClasses.length];
      const isPresent = Math.random() > 0.3; // 70% chance of being present
      
      if (isPresent) presentCount++;
      else absentCount++;
      
      const hours = 9 + i * 2; // Classes at 9am, 11am, 1pm, etc.
      const mockDate = new Date(today);
      mockDate.setHours(hours, 0, 0, 0);
      
      mockRecords.push({
        _id: `mock-${i}-${Date.now()}`,
        date: mockDate.toISOString(),
        status: isPresent,
        topic: mockClass.subject,
        notes: `${mockClass.subject} lecture ${i+1}`,
        comments: '',
        markedBy: { name: 'System (Mock)' },
        lectureNo: (i+1).toString(),
        day: mockDate.toLocaleDateString('en-US', { weekday: 'long' }),
        group: mockClass.group,
        subgroup: mockClass.subgroup
      });
    }
    
    // Sort by time (latest first)
    mockRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    setTodayAttendance(mockRecords);
    setTodayStats({
      total: mockRecords.length,
      present: presentCount,
      absent: absentCount
    });
  };
  
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleMainGroupExpand = (mainGroupId) => {
    setExpandedMainGroup(expandedMainGroup === mainGroupId ? null : mainGroupId);
  };

  const handleSubGroupSelect = async (subGroup) => {
    setSelectedSubGroup(subGroup);
    setAttendanceLoading(true);
    try {
      console.log('Selecting subgroup:', subGroup);
      const userId = user?.id || user?._id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Fetch all attendance records for the current student
      const res = await axios.get('/api/student/attendance', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Student attendance API response (length):', res.data?.length || 0);
      
      if (res.data && Array.isArray(res.data)) {
        // First, filter for the selected subgroup
        const filteredRecords = res.data.filter(session => {
          // Check if this attendance record is for the selected subgroup
          // The subGroupId could be an object with _id or a string
          const sessionSubGroupId = 
            (typeof session.subGroupId === 'object') ? session.subGroupId?._id : session.subGroupId;
          const targetSubGroupId = subGroup._id;
          
          console.log('Comparing:', { sessionSubGroupId, targetSubGroupId });
          return sessionSubGroupId === targetSubGroupId;
        });
        
        console.log('Filtered for subgroup (count):', filteredRecords.length);
        
        // For each attendance session, find this student's record
        const processedRecords = [];
        
        filteredRecords.forEach(session => {
          // Find this student's record in the session
          if (session.records && Array.isArray(session.records)) {
            const studentRecord = session.records.find(record => {
              const recordStudentId = 
                (typeof record.studentId === 'object') ? record.studentId?._id : record.studentId;
              return recordStudentId === userId;
            });
            
            if (studentRecord) {
              // Format the record for display
              processedRecords.push({
                _id: session._id,
                date: session.date,
                status: studentRecord.present,
                topic: session.subject || 'Regular Class',
                notes: session.remarks || '',
                comments: '',
                markedBy: { 
                  name: session.createdBy?.name || 'Admin'
                },
                lectureNo: session.lectureNo?.toString() || '1',
                day: session.day || new Date(session.date).toLocaleDateString('en-US', { weekday: 'long' })
              });
            } else {
              console.log('Student record not found in this session:', session._id);
            }
          }
        });
        
        console.log('Final processed records:', processedRecords);
        setAttendanceRecords(processedRecords);
        calculateAttendanceStats(processedRecords);
      } else {
        console.log('No attendance data returned or invalid format');
        setAttendanceRecords([]);
        setAttendanceStats({
          totalLectures: 0,
          present: 0,
          absent: 0,
          percentage: 0
        });
      }
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setAttendanceRecords([]);
      setAttendanceStats({
        totalLectures: 0,
        present: 0,
        absent: 0,
        percentage: 0
      });
    }
    setAttendanceLoading(false);
  };

  const handleRefresh = () => {
    fetchStudentGroups();
  };

  const calculateAttendanceStats = (records) => {
    if (!records || records.length === 0) {
      setAttendanceStats({
        totalLectures: 0,
        present: 0,
        absent: 0,
        percentage: 0
      });
      return;
    }
    
    let presentCount = 0;
    let totalLectures = records.length;

    records.forEach(record => {
      if (record.status) {
        presentCount++;
      }
    });

    const absentCount = totalLectures - presentCount;
    const percentage = Math.round((presentCount / totalLectures) * 100);

    console.log('Attendance Stats Calculated:', {
      totalLectures,
      present: presentCount,
      absent: absentCount,
      percentage
    });

    setAttendanceStats({
      totalLectures,
      present: presentCount,
      absent: absentCount,
      percentage
    });
  };

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

  return (
    <Box sx={{
      width: '100vw',
      height: 'calc(100vh - 64px)',
      position: 'fixed',
      top: '64px',
      left: 0,
      overflow: 'hidden',
      bgcolor: '#f4f6fa',
      display: 'flex',
      flexDirection: 'column',
      pt: 0
    }}>
      <StudentNavbar user={user} onLogout={() => { /* implement logout if needed */ }} />
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
          <Paper 
            elevation={2}
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
                <IconButton onClick={handleRefresh} size="small" color="primary" sx={{ bgcolor: 'primary.lighter', '&:hover': { bgcolor: 'primary.light' } }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* Search Filter */}
            <TextField
              size="small"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                      title="Clear search"
                    >
                      <Cancel fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Divider sx={{ mb: 2 }} />

            {/* Groups List Container with Auto Scrollbar */}
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              maxHeight: '100%',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#bdbdbd',
                borderRadius: '10px',
                '&:hover': {
                  background: '#a5a5a5',
                },
              },
            }}>
              {/* Loading indicator */}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', my: 4 }}>
                  <CircularProgress size={30} sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">Loading your groups...</Typography>
                </Box>
              )}

              {/* No groups state */}
              {!loading && filteredGroups.length === 0 && mainGroups.length === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 4 }}>
                  <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: 'grey.200' }}>
                    <School sx={{ fontSize: 30, color: 'text.secondary' }} />
                  </Avatar>
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                    You are not part of any groups yet.
                  </Typography>
                </Box>
              )}

              {/* No search results state */}
              {!loading && filteredGroups.length === 0 && mainGroups.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 4 }}>
                  <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: 'grey.200' }}>
                    <Search sx={{ fontSize: 30, color: 'text.secondary' }} />
                  </Avatar>
                  <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No groups match your search
                  </Typography>
                  <Button variant="text" size="small" onClick={() => setSearchQuery('')} sx={{ mt: 1 }}>
                    Clear search
                  </Button>
                </Box>
              )}

              {!loading && filteredGroups.map((group) => (
                <Box 
                  key={group._id} 
                  sx={{
                    mb: 2, 
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: expandedMainGroup === group._id ? 2 : 0,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <ListItemButton
                    onClick={() => handleMainGroupExpand(group._id)}
                    selected={expandedMainGroup === group._id}
                    sx={{
                      py: 1.5,
                      borderRadius: expandedMainGroup === group._id ? '8px 8px 0 0' : 1,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }
                    }}
                  >
                    <ListItemText 
                      primary={group.name} 
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    {expandedMainGroup === group._id ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>
                  <Collapse in={expandedMainGroup === group._id} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2, bgcolor: expandedMainGroup === group._id ? 'rgba(0, 0, 0, 0.02)' : 'transparent' }}>
                      {group.subGroups && group.subGroups.length > 0 ? (
                        <Grid container spacing={1.5}>
                          {group.subGroups.map((subgroup) => {
                            const isSelected = selectedSubGroup && selectedSubGroup._id === subgroup._id;
                            return (
                              <Grid item xs={12} sm={6} key={subgroup._id}>
                                <Card 
                                  elevation={0}
                                  onClick={() => handleSubGroupSelect(subgroup)}
                                  sx={{
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    bgcolor: isSelected ? 'primary.main' : 'background.paper',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      transform: 'translateY(-2px)',
                                      boxShadow: 2,
                                      borderColor: isSelected ? 'primary.main' : 'primary.light',
                                    }
                                  }}
                                >
                                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    <Group fontSize="small" color={isSelected ? 'inherit' : 'primary'} sx={{ mr: 0.5 }} />
                                    <Typography 
                                      variant="body2"
                                      fontWeight={isSelected ? 600 : 500}
                                      color={isSelected ? 'white' : 'text.primary'}
                                      align="center"
                                      noWrap
                                    >
                                      {subgroup.name}
                                    </Typography>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            No subgroups available
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        {/* Right Panel - Attendance Records */}
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
            elevation={2}
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
            {/* Title Section */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  Attendance
                </Typography>
              </Box>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
                Track your class attendance and stay on top of your progress.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Tooltip title="Dashboard"><IconButton size="small" onClick={() => window.location.href = '/student/dashboard'}><School color="primary" /></IconButton></Tooltip>
                <Typography variant="body2" color="text.secondary">/</Typography>
                <Typography variant="body2" color="primary.main" fontWeight={600}>Attendance</Typography>
              </Box>
            </Box>
            
            {/* Navigation Breadcrumbs */}
            {selectedSubGroup && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1.5, px: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <School fontSize="small" color="primary" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {mainGroups.find(g => g._id === expandedMainGroup)?.name || 'Main Group'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>
                    /
                  </Typography>
                  <Chip 
                    label={selectedSubGroup.name} 
                    color="primary" 
                    size="small"
                    variant="filled"
                    sx={{ fontWeight: 500, py: 0.5 }}
                  />
                </Box>
              </Box>
            )}
            
            {/* Scrollable Content Area */}
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#bdbdbd',
                borderRadius: '10px',
                '&:hover': {
                  background: '#a5a5a5',
                },
              },
            }}>

            {/* Loading state */}
            {(attendanceLoading || overviewLoading) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Today's attendance overview when no group selected */}
            {!attendanceLoading && !overviewLoading && !selectedSubGroup && (
              <Box sx={{ width: '100%' }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Today fontSize="small" color="primary" /> Today's Attendance Overview
                  </Typography>
                  <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <StatsCard color="#f0f7ff">
                          <School sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                          <Typography variant="h4" fontWeight="bold" color="primary">{todayStats.total}</Typography>
                          <Typography variant="body2" color="text.secondary">Total Classes Today</Typography>
                        </StatsCard>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StatsCard color="#f0fdf4">
                          <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                          <Typography variant="h4" fontWeight="bold" color="success.main">{todayStats.present}</Typography>
                          <Typography variant="body2" color="text.secondary">Classes Attended</Typography>
                        </StatsCard>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StatsCard color="#fff1f2">
                          <Cancel sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                          <Typography variant="h4" fontWeight="bold" color="error.main">{todayStats.absent}</Typography>
                          <Typography variant="body2" color="text.secondary">Classes Missed</Typography>
                        </StatsCard>
                      </Grid>
                    </Grid>
                  </Paper>
                </Box>

                {todayAttendance.length > 0 ? (
                  <>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventNote fontSize="small" color="primary" /> Today's Attendance Records
                    </Typography>
                    {todayAttendance.map((record, index) => (
                      <Paper
                        key={record._id || index}
                        elevation={0}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          borderLeft: '4px solid',
                          borderLeftColor: record.status ? 'success.main' : 'error.main',
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                              <Avatar sx={{ bgcolor: record.status ? 'success.lighter' : 'error.lighter', mr: 2 }}>
                                {record.status ? <CheckCircle color="success" /> : <Cancel color="error" />}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                  {record.topic || 'Regular Class'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                  <b>Group:</b> {record.group} - {record.subgroup}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <b>Marked by:</b> {record.markedBy?.name || 'Admin'}
                                </Typography>
                                {record.notes && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    <b>Notes:</b> {record.notes}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, mt: { xs: 1, sm: 0 } }}>
                              <Chip
                                label={record.status ? 'Present' : 'Absent'}
                                color={record.status ? 'success' : 'error'}
                                size="small"
                                sx={{ fontWeight: 500, mb: 1 }}
                              />
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {new Date(record.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {record.day}, Lecture #{record.lectureNo}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                    <Avatar sx={{ width: 60, height: 60, mb: 2, bgcolor: 'grey.200' }}>
                      <EventBusy sx={{ fontSize: 30, color: 'text.secondary' }} />
                    </Avatar>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No attendance records for today
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                      Select a group from the left panel to view your complete attendance history
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* No data state */}
            {!attendanceLoading && selectedSubGroup && attendanceRecords.length === 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Typography variant="body1" color="text.secondary">
                  No attendance records found for this group
                </Typography>
              </Box>
            )}

            {/* Attendance data */}
            {!attendanceLoading && selectedSubGroup && attendanceRecords.length > 0 && (
            <>
              {/* Attendance Statistics Summary */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline fontSize="small" /> Attendance Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard color="#f0f7ff">
                      <School sx={{ fontSize: 40, color: '#2196f3', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="primary">{attendanceStats.totalLectures}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Classes</Typography>
                    </StatsCard>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard color="#f5fff7">
                      <CheckCircle sx={{ fontSize: 40, color: '#4caf50', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="success.main">{attendanceStats.present}</Typography>
                      <Typography variant="body2" color="text.secondary">Present</Typography>
                    </StatsCard>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard color="#fff5f5">
                      <Cancel sx={{ fontSize: 40, color: '#f44336', mb: 1 }} />
                      <Typography variant="h4" fontWeight="bold" color="error.main">{attendanceStats.absent}</Typography>
                      <Typography variant="body2" color="text.secondary">Absent</Typography>
                    </StatsCard>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <StatsCard color={attendanceStats.percentage >= 75 ? '#f0f9eb' : attendanceStats.percentage >= 60 ? '#fdf6ec' : '#fef0f0'}>
                      <Box sx={{ position: 'relative', width: '100%', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ position: 'absolute', width: 70, height: 70 }}>
                          <CircularProgress
                            variant="determinate"
                            value={attendanceStats.percentage}
                            size={70}
                            thickness={5}
                            sx={{
                              color: attendanceStats.percentage >= 75 ? 'success.main' : 
                                    attendanceStats.percentage >= 60 ? 'warning.main' : 'error.main',
                            }}
                          />
                        </Box>
                        <Typography variant="h5" fontWeight="bold" 
                          color={attendanceStats.percentage >= 75 ? 'success.main' : 
                                attendanceStats.percentage >= 60 ? 'warning.main' : 'error.main'}
                        >
                          {attendanceStats.percentage}%
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
                    </StatsCard>
                  </Grid>
                </Grid>
              </Box>
              
              {/* Attendance Records Table */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EventNote fontSize="small" /> Date-wise Attendance
                </Typography>
                
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableCell width="20%" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarMonth fontSize="small" color="primary" />
                            Date
                          </Box>
                        </TableCell>
                        <TableCell width="35%" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <School fontSize="small" color="primary" />
                            Topic/Session
                          </Box>
                        </TableCell>
                        <TableCell width="15%" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Status
                          </Box>
                        </TableCell>
                        <TableCell width="30%" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <EventNote fontSize="small" color="primary" />
                            Details
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record) => {
                        const date = new Date(record.date);
                        const formattedDate = date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                        
                        return (
                          <AttendanceRow key={record._id} status={record.status}>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" fontWeight="medium">{formattedDate}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTime fontSize="small" sx={{ fontSize: 14 }} />
                                  {record.day}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>{record.topic}</Typography>
                              {record.notes && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  {record.notes}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={record.status}>
                                {record.status ? (
                                  <>
                                    <CheckCircle fontSize="small" />
                                    Present
                                  </>
                                ) : (
                                  <>
                                    <Cancel fontSize="small" />
                                    Absent
                                  </>
                                )}
                              </StatusBadge>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Typography variant="body2">Lecture {record.lectureNo}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Person fontSize="small" sx={{ fontSize: 14 }} />
                                  Marked by: {record.markedBy?.name || 'Admin'}
                                </Typography>
                                {record.comments && (
                                  <Typography variant="caption" display="block" color="info.main" sx={{ mt: 0.5 }}>
                                    Note: {record.comments}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                          </AttendanceRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
              
              {/* Monthly Attendance Summary */}
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth fontSize="small" /> Monthly Summary
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                {/* Group records by month and calculate stats */}
                {(() => {
                  // Group records by month
                  const recordsByMonth = {};
                  
                  attendanceRecords.forEach(record => {
                    const date = new Date(record.date);
                    const monthYear = `${date.getMonth()}-${date.getFullYear()}`;
                    
                    if (!recordsByMonth[monthYear]) {
                      recordsByMonth[monthYear] = {
                        month: date.toLocaleDateString('en-US', { month: 'long' }),
                        year: date.getFullYear(),
                        records: []
                      };
                    }
                    
                    recordsByMonth[monthYear].records.push(record);
                  });
                  
                  // Convert to array and sort by date (newest first)
                  return Object.values(recordsByMonth)
                    .sort((a, b) => {
                      const aDate = new Date(a.year, new Date(a.month + ' 1, 2000').getMonth());
                      const bDate = new Date(b.year, new Date(b.month + ' 1, 2000').getMonth());
                      return bDate - aDate;
                    })
                    .map(monthData => {
                      const totalClasses = monthData.records.length;
                      const presentCount = monthData.records.filter(r => r.status).length;
                      const percentage = Math.round((presentCount / totalClasses) * 100) || 0;
                      
                      return (
                        <Paper 
                          key={`${monthData.month}-${monthData.year}`}
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            borderRadius: 2,
                            border: '1px solid #e0e0e0',
                            minWidth: 220,
                            flex: '1 0 auto'
                          }}
                        >
                          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            {monthData.month} {monthData.year}
                          </Typography>
                          
                          <Grid container spacing={1}>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Classes</Typography>
                              <Typography variant="h6">{totalClasses}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Present</Typography>
                              <Typography variant="h6">{presentCount}</Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography variant="body2" color="text.secondary">Rate</Typography>
                              <Typography 
                                variant="h6" 
                                color={percentage >= 75 ? 'success.main' : percentage >= 60 ? 'warning.main' : 'error.main'}
                              >
                                {percentage}%
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      );
                    });
                })()} 
              </Box>
            </>
            )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentAttendanceDashboard;
