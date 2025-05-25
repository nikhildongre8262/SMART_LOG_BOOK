import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Paper, Button, Divider, Accordion, AccordionSummary, AccordionDetails, CircularProgress, List, ListItem, ListItemText, Grid, Fade, Avatar, Chip, Tabs, Tab, TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Pagination, Breadcrumbs, InputAdornment, Tooltip } from '@mui/material';
import { ExpandMore, AddCircle, CloudDownload, FilterList, Sort, CalendarMonth, Search, NavigateBefore, NavigateNext, FirstPage, LastPage, Refresh, Cancel, School, AssignmentTurnedIn, Edit, Category, Event as EventIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../../components/AdminNavbar';
import AdminSidebar from '../../../components/AdminSidebar';
import AddAttendance from './AddAttendance.jsx';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AttendanceDashboard = () => {
  const [mainGroups, setMainGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [expandedMainGroup, setExpandedMainGroup] = useState(null);
  const [subGroups, setSubGroups] = useState({});
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  // Add new state for edit mode
  const [showAddAttendance, setShowAddAttendance] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  
  // Navigation state
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(5);
  const [filterDate, setFilterDate] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [navigationView, setNavigationView] = useState('list'); // 'list' or 'calendar'

  // Add state for search, sort, filters, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  // Filter groups based on search query
  useEffect(() => {
    if (groupSearchQuery.trim() === '') {
      setFilteredGroups(mainGroups);
    } else {
      const lowerCaseQuery = groupSearchQuery.toLowerCase().trim();
      const filtered = mainGroups.filter(group => {
        // Check if the main group name matches the query
        if (group.name.toLowerCase().includes(lowerCaseQuery)) {
          return true;
        }
        
        // Check if any subgroup name matches the query
        const groupSubgroups = subGroups[group._id] || [];
        return groupSubgroups.some(subgroup => 
          subgroup.name.toLowerCase().includes(lowerCaseQuery)
        );
      });
      setFilteredGroups(filtered);
    }
  }, [groupSearchQuery, mainGroups, subGroups]);

  // Fetch main groups on mount
  useEffect(() => {
    const fetchMainGroups = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/groups', { headers: { Authorization: `Bearer ${token}` } });
        setMainGroups(res.data);
        setFilteredGroups(res.data);
        
        // Prefetch all subgroups for better search experience
        for (const group of res.data) {
          if (!subGroups[group._id]) {
            try {
              const subgroupRes = await axios.get(`/api/groups/${group._id}`, { 
                headers: { Authorization: `Bearer ${token}` } 
              });
              setSubGroups(prev => ({ ...prev, [group._id]: subgroupRes.data.subGroups || [] }));
            } catch (error) {
              console.error(`Error fetching subgroups for ${group.name}:`, error);
            }
          }
        }
        
        // Restore last selected subgroup and fetch attendance
        const lastSubGroup = JSON.parse(localStorage.getItem('lastSelectedAttendanceSubGroup'));
        if (lastSubGroup && lastSubGroup._id) {
          setSelectedSubGroup(lastSubGroup);
          setExpandedMainGroup(lastSubGroup.mainGroupId);
          setLoading(true);
          const res2 = await axios.get(`/api/attendance/group/${lastSubGroup.mainGroupId}/subgroup/${lastSubGroup._id}`, { headers: { Authorization: `Bearer ${token}` } });
          setAttendanceRecords(res2.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
        setMainGroups([]);
        setFilteredGroups([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMainGroups();
  }, [token]);

  // Fetch sub-groups for a main group
  const handleExpandMainGroup = async (mainGroupId) => {
    setExpandedMainGroup(expandedMainGroup === mainGroupId ? null : mainGroupId);
    setSelectedSubGroup(null);
    setAttendanceRecords([]);
    if (!subGroups[mainGroupId]) {
      setLoading(true);
      try {
        const res = await axios.get(`/api/groups/${mainGroupId}`, { headers: { Authorization: `Bearer ${token}` } });
        setSubGroups(prev => ({ ...prev, [mainGroupId]: res.data.subGroups || [] }));
      } catch {
        setSubGroups(prev => ({ ...prev, [mainGroupId]: [] }));
      }
      setLoading(false);
    }
  };

  // Fetch attendance for a sub-group
  const handleSelectSubGroup = async (mainGroupId, subGroup) => {
    setSelectedSubGroup({ ...subGroup, mainGroupId });
    localStorage.setItem('lastSelectedAttendanceSubGroup', JSON.stringify({ ...subGroup, mainGroupId }));
    setAttendanceRecords([]);
    setLoading(true);
    try {
      const res = await axios.get(`/api/attendance/group/${mainGroupId}/subgroup/${subGroup._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttendanceRecords(res.data);
    } catch {
      setAttendanceRecords([]);
    }
    setLoading(false);
  };

  const handleAddAttendance = () => {
    setShowAddAttendance((prev) => !prev);
  };

  // Filter and sort attendance records when attendanceRecords, searchQuery, or sortOption changes
  useEffect(() => {
    let filtered = attendanceRecords.filter(r =>
      (r.subject && r.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.lectureNo && r.lectureNo.toString().includes(searchQuery))
    );
    if (sortOption === 'date-desc') {
      filtered = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === 'date-asc') {
      filtered = filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === 'lecture-asc') {
      filtered = filtered.sort((a, b) => a.lectureNo - b.lectureNo);
    } else if (sortOption === 'lecture-desc') {
      filtered = filtered.sort((a, b) => b.lectureNo - a.lectureNo);
    }
    setFilteredRecords(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    setPage(1);
  }, [attendanceRecords, searchQuery, sortOption]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleSortChange = (e) => setSortOption(e.target.value);
  const handlePageChange = (e, value) => setPage(value);

  // Attendance stats
  const attendanceStats = {
    total: filteredRecords.length,
    uniqueSubjects: [...new Set(filteredRecords.map(r => r.subject))].length,
    totalLectures: filteredRecords.length,
  };

  const handleEditAttendance = (record) => {
    setEditingAttendance(record);
    setShowAddAttendance(true);
  };

  const handleCloseForm = () => {
    setShowAddAttendance(false);
    setEditingAttendance(null);
  };

  // Handle exporting all attendance data with calculations
  const handleExportAttendance = async () => {
    if (!selectedSubGroup || !selectedSubGroup.mainGroupId || !selectedSubGroup._id) {
      toast.error('Please select a valid subgroup first');
      return;
    }
    
    setLoading(true);
    try {
      // Get all attendance records for the selected subgroup
      const res = await axios.get(`/api/attendance/group/${selectedSubGroup.mainGroupId}/subgroup/${selectedSubGroup._id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      // Debug: Log the structure of the first attendance record to see the data format
      if (res.data.length > 0 && res.data[0].records && res.data[0].records.length > 0) {
        console.log('Debug - First attendance record:', res.data[0]);
        console.log('Debug - First student record:', res.data[0].records[0]);
        
        // Log specific properties to check how to access student data
        const firstStudentRecord = res.data[0].records[0];
        console.log('Student properties available:', {
          'direct name': firstStudentRecord.name,
          'direct studentId': firstStudentRecord.studentId,
          'student object': firstStudentRecord.student,
          'student._id': firstStudentRecord.student?._id,
          'student.name': firstStudentRecord.student?.name
        });
      }
      
      if (res.data.length === 0) {
        toast.warning('No attendance records to export');
        setLoading(false);
        return;
      }

      // Create a map of students with attendance data
      const studentMap = {};
      let totalLectures = res.data.length;
      let dateColumns = [];
      
      // Collect all dates and create column headers
      res.data.forEach(record => {
        const dateStr = new Date(record.date).toLocaleDateString();
        if (!dateColumns.includes(dateStr)) {
          dateColumns.push(dateStr);
        }

        // Initialize student records if needed
        record.records.forEach(studentRecord => {
          // Try to access studentId and name from the record structure
          let studentId = null;
          let studentName = null;
          
          // Try all potential structures for student information
          if (studentRecord.studentId) {
            // If studentId exists directly on the record
            studentId = studentRecord.studentId;
            studentName = studentRecord.name || 'Unknown';
          } else if (studentRecord.student) {
            // If student is a nested object
            studentId = studentRecord.student._id;
            studentName = studentRecord.student.name || 'Unknown';
          } else if (studentRecord._id) {
            // Use the record's _id as fallback
            studentId = studentRecord._id;
            studentName = studentRecord.name || 'Unknown';
          }
          
          // If no valid ID, skip this record
          if (!studentId) {
            return;
          }
          
          // Try to get name from related data if it's still missing
          if (!studentName || studentName === 'Unknown') {
            // Look for any property that might contain a name
            for (const key of Object.keys(studentRecord)) {
              if (
                typeof studentRecord[key] === 'object' && 
                studentRecord[key] !== null && 
                studentRecord[key].name
              ) {
                studentName = studentRecord[key].name;
                break;
              }
            }
          }

          if (!studentMap[studentId]) {
            studentMap[studentId] = {
              id: studentId,
              name: studentName,
              dates: {},
              presentCount: 0,
              absentCount: 0,
              totalLectures: totalLectures,
              attendancePercentage: 0
            };
          }
          
          // Add attendance data for this date
          studentMap[studentId].dates[dateStr] = studentRecord.present ? 'P' : 'A';
          
          // Update present/absent count
          if (studentRecord.present) {
            studentMap[studentId].presentCount++;
          } else {
            studentMap[studentId].absentCount++;
          }
        });
      });
      
      // Sort students by name and calculate attendance percentage
      let sortedStudents = Object.values(studentMap).sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
      
      // Calculate attendance percentage for each student
      sortedStudents.forEach(student => {
        student.attendancePercentage = ((student.presentCount / totalLectures) * 100).toFixed(2);
      });

      // Prepare CSV data with Excel-friendly formatting
      const headers = [
        'Student Name', 
        ...dateColumns, 
        'Present Count', 
        'Absent Count', 
        'Total Lectures', 
        'Attendance %'
      ];

      // Add title and report information (3 rows before the headers)
      const currentDate = new Date().toLocaleDateString();
      const csvRows = [];
      
      // Title and metadata rows (will appear at top of Excel sheet)
      csvRows.push(`"ATTENDANCE REPORT - ${selectedSubGroup.name.toUpperCase()}","","","","","",""`); 
      csvRows.push(`"Generated on: ${currentDate}","","","","","",""`); 
      csvRows.push(`"","","","","","",""`); // Empty row as separator
      
      // Format headers with better styling and add padding for better column width in Excel
      const formattedHeaders = headers.map(header => {
        // Add some spaces as padding to force Excel to make columns wider
        const paddedHeader = header.toUpperCase().padEnd(header.length + 4, ' ');
        return `"${paddedHeader}"`;
      });
      csvRows.push(formattedHeaders.join(','));

      // Add data rows (already sorted by name)
      sortedStudents.forEach((student, index) => {
        // Create a row of data with better formatting
        const rowData = [
          // Add padding to student name to ensure column is wide enough
          student.name.padEnd(Math.max(20, student.name.length), ' '),
          ...dateColumns.map(date => {
            const status = student.dates[date];
            // Format attendance status with visual indicators and padding
            if (status === 'P') return '  ✓  '; // Checkmark for present with padding
            if (status === 'A') return '  ✗  '; // X for absent with padding
            return ' N/A ';
          }),
          // Add padding to numeric values for better visibility
          `  ${student.presentCount}  `,
          `  ${student.absentCount}  `,
          `  ${student.totalLectures}  `,
          // Make percentage more visible with formatting
          `  ${student.attendancePercentage}%  `
        ];
        
        // Properly escape all fields for Excel compatibility
        const escapedRowData = rowData.map(field => {
          // Convert field to string if it's not already
          const fieldStr = String(field);
          
          // Properly escape the field for Excel
          // Excel requires special handling for fields containing commas, quotes, or newlines
          if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n') || fieldStr.length > 15) {
            // Replace quotes with double quotes per CSV spec and wrap in quotes
            return `"${fieldStr.replace(/"/g, '""')}"`;
          }
          return fieldStr;
        });
        
        // Add the row to our CSV data
        csvRows.push(escapedRowData.join(','));
        
        // Add visual separation after students with low attendance
        if (parseFloat(student.attendancePercentage) < 75 && index < sortedStudents.length - 1) {
          const isNextStudentLowAttendance = parseFloat(sortedStudents[index + 1].attendancePercentage) < 75;
          if (!isNextStudentLowAttendance) {
            // Add a blank row for visual grouping
            csvRows.push(`"","","","","","",""`); // Empty row as separator
          }
        }
      });

      // Add summary row at the end
      csvRows.push(`"","","","","","",""`); // Empty row as separator
      
      // Calculate class average attendance percentage
      const totalStudents = sortedStudents.length;
      const averageAttendance = totalStudents > 0 ? 
        (sortedStudents.reduce((sum, student) => sum + parseFloat(student.attendancePercentage), 0) / totalStudents).toFixed(2) : 
        0;
      
      // Add summary information
      csvRows.push(`"SUMMARY","","","","","",""`); 
      csvRows.push(`"Total Students: ${totalStudents}","","","","","",""`); 
      csvRows.push(`"Average Attendance: ${averageAttendance}%","","","","","",""`); 
      csvRows.push(`"Total Lectures: ${totalLectures}","","","","","",""`); 
      
      // Add BOM to ensure Excel properly recognizes UTF-8 encoding
      const BOM = '\uFEFF';
      
      // Create properly formatted Excel-friendly CSV
      const csvContent = BOM + csvRows.join('\n');
      
      // For Excel, we're adding an HTML instruction that will be ignored by Excel but helps users
      const exportMessage = "\n\n" + 
        "<!-- EXCEL IMPORT TIP: When opening in Excel, select column A, then use 'Data > Text to Columns' for better formatting. -->";
      
      // Add the export message to the file content
      const enhancedCsvContent = csvContent + exportMessage;
      
      // Create and trigger the download with an instructive filename
      const blob = new Blob([enhancedCsvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      // Add 'Excel' to the filename to hint at the intended application
      link.setAttribute('download', `${selectedSubGroup.name}_attendance_report_Excel.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Display a toast with Excel opening instructions
      toast.info('For best results, open the CSV in Excel and use Data > Text to Columns for proper formatting', {
        autoClose: 7000 // Show for 7 seconds
      });
      
      toast.success('Attendance report exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export attendance data');
    }
    setLoading(false);
  };

  const { user } = useAuth();
  // Placeholder logout handler (implement if needed)
  const handleLogout = () => { window.location.href = '/login'; };

  return (
    <>
      <AdminNavbar user={user} onLogout={handleLogout} />
      <AdminSidebar selected="attendance" />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
        <Box 
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 4 },
            mt: 8,
            ml: { xs: 0, md: '220px' },
            transition: 'margin 0.3s',
            width: '100%',
          }}
        >
          {/* Breadcrumb Navigation */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">Attendance Management</Typography>
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
                  Attendance
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
                Manage attendance records across groups and subgroups. Add, edit, and export attendance easily.
              </Typography>
            </Paper>
          </Box>
          <Fade in timeout={500}>
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School fontSize="small" /> Groups & Subgroups
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={handleExportAttendance}
                      color="primary"
                      sx={{ bgcolor: 'primary.lighter' }}
                    >
                      <CloudDownload fontSize="small" />
                    </IconButton>
                  </Box>
                  {/* No groups message */}
                  {mainGroups.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                      <Avatar sx={{ mx: 'auto', mb: 2, width: 70, height: 70, bgcolor: 'primary.lighter' }}>
                        <School sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
                        No Groups Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        You haven't created any groups yet. Groups are needed to organize your attendance records.
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
                          {!subGroups[mainGroup._id] ? (
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
                                Select a subgroup to view its attendance records:
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
                </Paper>
              </Grid>
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
                              placeholder="Search attendance records..."
                              size="small"
                              value={searchQuery}
                              onChange={handleSearchChange}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Sort fontSize="small" color="action" />
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
                                <MenuItem value="date-desc">Newest Date</MenuItem>
                                <MenuItem value="date-asc">Oldest Date</MenuItem>
                                <MenuItem value="lecture-asc">Lecture Asc</MenuItem>
                                <MenuItem value="lecture-desc">Lecture Desc</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>
                          {/* Filter Button (placeholder for future filters) */}
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
                      </Paper>
                      {/* Attendance Stats Section */}
                      <Box sx={{ display: 'flex', mb: 2 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 1.5, 
                                borderRadius: 2, 
                                bgcolor: 'primary.lighter', 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                <CalendarMonth />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                  {attendanceStats.total}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total Records
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 1.5, 
                                borderRadius: 2, 
                                bgcolor: 'success.lighter', 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                                <AssignmentTurnedIn />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                  {attendanceStats.uniqueSubjects}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Subjects
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                          <Grid item xs={4}>
                            <Paper 
                              elevation={0}
                              sx={{ 
                                p: 1.5, 
                                borderRadius: 2, 
                                bgcolor: 'warning.lighter', 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
                                <EventIcon />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="warning.main">
                                  {attendanceStats.totalLectures}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Lectures
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                  {/* Attendance Content Area */}
                  {!selectedSubGroup ? (
                    // No subgroup selected state
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 6 }}>
                      <Avatar sx={{ width: 80, height: 80, mb: 3, bgcolor: 'primary.lighter' }}>
                        <CalendarMonth sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="h6" align="center" gutterBottom>
                        Select a subgroup to view attendance records
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 3 }}>
                        Choose a group and subgroup from the left panel to view and manage attendance records. You can add, edit, and export attendance.
                      </Typography>
                    </Box>
                  ) : loading ? (
                    // Loading state
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredRecords.length === 0 ? (
                    // Empty state
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 4 }}>
                      <Avatar sx={{ width: 70, height: 70, mb: 2, bgcolor: 'primary.lighter' }}>
                        <CalendarMonth sx={{ fontSize: 35, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="h6" align="center" gutterBottom>
                        No attendance records found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 400 }}>
                        {searchQuery ?
                          'No attendance records match your search criteria. Try adjusting your search.' :
                          `There are no attendance records in the "${selectedSubGroup.name}" subgroup yet. Add your first attendance record using the button above.`}
                      </Typography>
                    </Box>
                  ) : (
                    // Attendance Grid View
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                      <Grid container spacing={2}>
                        {filteredRecords
                          .slice((page - 1) * pageSize, page * pageSize)
                          .map(record => (
                            <Grid item xs={12} sm={6} key={record._id}>
                              <Paper 
                                elevation={3} 
                                sx={{ 
                                  borderRadius: 3, 
                                  borderLeft: '6px solid',
                                  borderLeftColor: 'primary.main',
                                  boxShadow: 2,
                                  transition: 'box-shadow 0.2s',
                                  '&:hover': {
                                    boxShadow: 6,
                                    transform: 'translateY(-2px) scale(1.02)',
                                  },
                                  display: 'flex',
                                  flexDirection: 'column',
                                  minHeight: 180,
                                  position: 'relative',
                                  bgcolor: '#f9fafc',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, pb: 0 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                                    <CalendarMonth sx={{ fontSize: 32, color: 'white' }} />
                                  </Avatar>
                                  <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, color: 'primary.dark' }}>
                                      {record.subject || 'No Subject'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Lecture {record.lectureNo}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ px: 2, pt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                                    {new Date(record.date).toLocaleDateString()} ({record.day})
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, px: 2, pb: 2 }}>
                                  <Tooltip title="Edit">
                                    <IconButton size="small" color="primary" onClick={() => handleEditAttendance(record)}>
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Export">
                                    <IconButton size="small" color="secondary" onClick={async () => {
                                      try {
                                        const res = await axios.get(`/api/attendance/export/single/${record._id}`, {
                                          headers: { Authorization: `Bearer ${token}` },
                                          responseType: 'blob'
                                        });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `${record.subject || 'attendance'}_lecture${record.lectureNo}.csv`);
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } catch (error) {
                                        toast.error('Failed to export attendance record');
                                      }
                                    }}>
                                      <CloudDownload fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Paper>
                            </Grid>
                          ))}
                      </Grid>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                          <Pagination 
                            count={totalPages} 
                            page={page} 
                            onChange={handlePageChange} 
                            color="primary" 
                            size="medium"
                            showFirstButton 
                            showLastButton
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                  {/* Add Attendance Dialog remains unchanged */}
                  {showAddAttendance && selectedSubGroup && (
                    <AddAttendance
                      group={mainGroups.find(g => g._id === selectedSubGroup?.mainGroupId)}
                      subGroup={selectedSubGroup}
                      editingAttendance={editingAttendance}
                      onSuccess={() => {
                        handleCloseForm();
                        handleExportAttendance();
                      }}
                      onCancel={handleCloseForm}
                    />
                  )}
                  {selectedSubGroup && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<AddCircle />} 
                        onClick={() => setShowAddAttendance(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Attendance
                      </Button>
                      {filteredRecords.length > 0 && (
                        <Button 
                          variant="contained" 
                          color="secondary" 
                          startIcon={<CloudDownload />} 
                          onClick={handleExportAttendance}
                          sx={{ borderRadius: 2 }}
                        >
                          Export
                        </Button>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Fade>
        </Box>
      </Box>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </>
  );
};

export default AttendanceDashboard;
