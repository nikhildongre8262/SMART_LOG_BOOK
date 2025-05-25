import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Typography, Paper, CircularProgress, IconButton, 
  Divider, Button, List, ListItem, ListItemText, ListItemButton, TextField,
  InputAdornment, Card, CardContent, CardActions, CardMedia,
  Tooltip, Chip, Avatar, Collapse, FormControl, Select, MenuItem,
  Breadcrumbs, Stack, Tab, Tabs, Badge, Pagination, Dialog,
  DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Search, FilterList, Download, Visibility, YouTube, 
  Category, Sort, CalendarToday, PictureAsPdf, InsertDriveFile,
  ExpandLess, ExpandMore, FolderIcon, FolderOpenIcon, School, Close, Folder, Home, ArrowForwardIos
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import ResourceRightPanel from './ResourceRightPanel';

// Scrollable container with custom scrollbar
const ScrollableBox = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 64px)',
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

// Use direct paths for API calls
// No API constant needed as we'll use direct paths

const StudyResources = () => {
  // Authentication and navigation
  const { user, token: contextToken } = useAuth() || {};
  const token = contextToken || localStorage.getItem('token');
  const navigate = useNavigate();
  
  // State management
  const [mainGroups, setMainGroups] = useState([]);
  const [subGroups, setSubGroups] = useState({});
  const [selectedMainGroup, setSelectedMainGroup] = useState(null);
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);
  
  // Filter states
  const [sortOption, setSortOption] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: {
      startDate: '',
      endDate: '',
    },
    fileTypes: [],
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch groups on component mount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    fetchMainGroups();
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch main groups that the student is enrolled in
  const fetchMainGroups = async () => {
    setLoading(true);
    try {
      // Get the student's groups
      const res = await axios.get('/api/student/groups', { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Set the groups the student is enrolled in
      const groups = res.data || [];
      
      if (groups.length > 0) {
        console.log('Successfully loaded student groups:', groups.length);
        setMainGroups(groups);
      } else {
        console.log('No student groups found. Please join a group to access resources.');
        toast.info('You are not enrolled in any groups yet. Please join a group to access study resources.');
      }
    } catch (error) {
      console.error('Error fetching student groups:', error);
      toast.error('Failed to load your groups. Please refresh the page or try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expanded group
  const handleExpandGroup = async (groupId) => {
    // Check if already expanded
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(prev => prev.filter(id => id !== groupId));
      return;
    }
    
    // Add to expanded list
    setExpandedGroups(prev => [...prev, groupId]);
    
    // Check if we already have subgroups from the main groups data
    const selectedGroup = mainGroups.find(g => g._id === groupId);
    
    if (selectedGroup && selectedGroup.subGroups && selectedGroup.subGroups.length > 0) {
      // If subgroups are already included in the main group data, use those
      console.log('Using subgroups from main group data');
      setSubGroups(prev => ({
        ...prev,
        [groupId]: selectedGroup.subGroups
      }));
    }
    // Only fetch subgroups if not already loaded and not included in the main group data
    else if (!subGroups[groupId]) {
      setLoading(true);
      try {
        // Try to get subgroups for this group
        const res = await axios.get(`/api/student/groups/${groupId}/subgroups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchedSubgroups = res.data || [];
        
        if (fetchedSubgroups.length > 0) {
          setSubGroups(prev => ({
            ...prev,
            [groupId]: fetchedSubgroups
          }));
        } else {
          // No subgroups found
          console.log('No subgroups found for this group');
          toast.info('No subject categories found for this group');
          setSubGroups(prev => ({
            ...prev,
            [groupId]: []
          }));
        }
      } catch (error) {
        console.error('Error fetching subgroups:', error);
        toast.error('Failed to load subject categories. Please try again later.');
        setSubGroups(prev => ({
          ...prev,
          [groupId]: []
        }));
      } finally {
        setLoading(false);
      }
    }
  };

  // Select a subgroup to view its resources
  const handleSelectSubGroup = async (mainGroupId, subGroup) => {
    setSelectedMainGroup(mainGroupId);
    setSelectedSubGroup(subGroup);
    setLoading(true);
    
    try {
      // Use the new student endpoint for fetching resources
      const res = await axios.get(`/api/student/resources/${mainGroupId}/${subGroup._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Extract resources from the response
      const resourceData = res.data.resources || [];
      
      if (resourceData.length > 0) {
        // Resources found successfully
        setResources(resourceData);
        setFilteredResources(resourceData);
        setTotalPages(Math.ceil(resourceData.length / pageSize));
      } else {
        // No resources found for this group/subgroup
        console.log('No resources found for this subgroup');
        toast.info('No study materials available for this subject yet');
        setResources([]);
        setFilteredResources([]);
        setTotalPages(1);
      }
      
      // Reset filters and search
      setSearchTerm('');
      setFilters({
        categories: [],
        dateRange: {
          startDate: '',
          endDate: '',
        },
        fileTypes: [],
      });
      setShowFilters(false);
      setSortOption('newest');
      setPage(1);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load study materials. Please try again later.');
      
      // Clear resources on error
      setResources([]);
      setFilteredResources([]);
      setTotalPages(1);
      
      // Reset filters and search
      setSearchTerm('');
      setFilters({
        categories: [],
        dateRange: {
          startDate: '',
          endDate: '',
        },
        fileTypes: [],
      });
      setShowFilters(false);
      setSortOption('newest');
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  // Preview a resource
  const handlePreviewResource = (resource) => {
    setPreviewResource(resource);
    setShowPreview(true);
  };

  // Close resource preview
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewResource(null);
  };

  // Apply filters and search
  useEffect(() => {
    if (!resources.length) return;
    
    // Filter resources based on search term and filters
    let filtered = [...resources];
    
    // Apply search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(resource => 
        resource.title.toLowerCase().includes(query) || 
        (resource.description && resource.description.toLowerCase().includes(query)) ||
        (resource.categories && resource.categories.some(cat => cat.toLowerCase().includes(query)))
      );
    }
    
    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter(resource => 
        resource.categories && 
        resource.categories.some(cat => filters.categories.includes(cat))
      );
    }
    
    // Apply date range filter
    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      filtered = filtered.filter(resource => {
        const resourceDate = new Date(resource.createdAt);
        let match = true;
        
        if (filters.dateRange.startDate) {
          const startDate = new Date(filters.dateRange.startDate);
          match = match && resourceDate >= startDate;
        }
        
        if (filters.dateRange.endDate) {
          const endDate = new Date(filters.dateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // End of day
          match = match && resourceDate <= endDate;
        }
        
        return match;
      });
    }
    
    // Apply file type filters
    if (filters.fileTypes.length > 0) {
      filtered = filtered.filter(resource => {
        if (filters.fileTypes.includes('videos') && resource.videoLink) {
          return true;
        }
        
        if (filters.fileTypes.includes('documents') && resource.fileUrl) {
          const ext = resource.fileUrl.split('.').pop().toLowerCase();
          if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)) {
            return true;
          }
        }
        
        if (filters.fileTypes.includes('others')) {
          if (!resource.videoLink && !resource.fileUrl) {
            return true;
          }
          if (resource.fileUrl) {
            const ext = resource.fileUrl.split('.').pop().toLowerCase();
            if (!['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)) {
              return true;
            }
          }
        }
        
        return false;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch(sortOption) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
    
    setFilteredResources(filtered);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    
    // Reset to first page when filters change
    if (page !== 1) {
      setPage(1);
    }
  }, [resources, searchTerm, filters, sortOption, pageSize, page]);
  
  // Add a function to get file type icon and color
  const getFileTypeIcon = (resource) => {
    if (resource.videoLink) return { icon: <YouTube color="error" />, color: 'error.main', label: 'Video' };
    if (resource.fileUrl) {
      const ext = resource.fileUrl.split('.').pop().toLowerCase();
      if (ext === 'pdf') return { icon: <PictureAsPdf color="error" />, color: 'error.main', label: 'PDF' };
      if (['doc', 'docx'].includes(ext)) return { icon: <InsertDriveFile color="primary" />, color: 'primary.main', label: 'DOC' };
      if (['ppt', 'pptx'].includes(ext)) return { icon: <InsertDriveFile color="warning" />, color: 'warning.main', label: 'PPT' };
      return { icon: <InsertDriveFile color="action" />, color: 'grey.700', label: ext.toUpperCase() };
    }
    return { icon: <InsertDriveFile color="disabled" />, color: 'grey.400', label: 'File' };
  };

  // Handler for resource download
  const handleDownloadResource = (resource) => {
    if (resource.fileUrl) {
      try {
        toast.info('Starting download...');
        let downloadUrl = resource.fileUrl.trim();
        if (downloadUrl.startsWith('/uploads/')) {
          const baseUrl = window.location.origin;
          downloadUrl = `${baseUrl}${downloadUrl}`;
        }
        fetch(downloadUrl)
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob();
          })
          .then(blob => {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const fileName = resource.fileUrl.split('/').pop() || resource.title || 'download';
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
            toast.success('Download complete!');
          })
          .catch(error => {
            console.error('Download error:', error);
            toast.error(`Download failed: ${error.message}`);
          });
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Download failed. Please try again.');
      }
    }
  };

  // Handler for watch video
  const handleWatchVideo = (resource) => {
    if (resource.videoLink) {
      window.open(resource.videoLink, '_blank');
    }
  };

  return (
    <Grid container spacing={2}>
      {/* Left Panel - Groups/Subgroups Navigation */}
      <Grid item xs={12} md={4} lg={3}>
        <ScrollableBox sx={{ pr: 2 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 2, 
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
              mb: 2,
              bgcolor: '#fff',
              boxShadow: { xs: 0, md: 1 }
            }}
          >
            {/* Heading with icon */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <School color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={600} color="primary.main">
                My Groups
              </Typography>
            </Box>
            {/* Group Search */}
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
            <List 
              sx={{ 
                width: '100%', 
                p: 0, 
                borderRadius: 2,
                '& .MuiListItemButton-root': {
                  borderRadius: 1.5,
                  mb: 0.5,
                }
              }} 
              component="nav"
            >
              {mainGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((group) => (
                <React.Fragment key={group._id}>
                  <ListItem 
                    disablePadding 
                    sx={{
                      bgcolor: expandedGroups.includes(group._id) ? 'primary.lighter' : 'transparent',
                      borderRadius: 1.5,
                      mb: 0.5,
                      overflow: 'hidden',
                      transition: 'background 0.2s',
                    }}
                  >
                    <Tooltip title={group.name} placement="right" arrow>
                      <ListItemButton onClick={() => handleExpandGroup(group._id)}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 16, mr: 1 }}>
                          {group.name[0]}
                        </Avatar>
                        <ListItemText 
                          primary={<Typography variant="subtitle1" fontWeight={500} color={expandedGroups.includes(group._id) ? 'primary.main' : 'text.primary'} noWrap>{group.name}</Typography>} 
                        />
                        {expandedGroups.includes(group._id) ? <ExpandLess color="primary" /> : <ExpandMore />}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  <Collapse in={expandedGroups.includes(group._id)} timeout="auto" unmountOnExit>
                    <Box sx={{ p: 2 }}>
                      {loading && !subGroups[group._id] ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                          <CircularProgress size={24} />
                        </Box>
                      ) : (subGroups[group._id] || []).length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 1, pl: 2 }}>
                          No subgroups available
                        </Typography>
                      ) : (
                        <Grid container spacing={1}>
                          {(subGroups[group._id] || []).map(subGroup => (
                            <Grid item xs={6} key={subGroup._id}>
                              <Tooltip title={subGroup.name} placement="top" arrow>
                                <ListItemButton
                                  sx={{
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: selectedSubGroup && selectedSubGroup._id === subGroup._id ? 'primary.main' : 'divider',
                                    bgcolor: selectedSubGroup && selectedSubGroup._id === subGroup._id ? 'primary.light' : 'background.paper',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 0.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: selectedSubGroup && selectedSubGroup._id === subGroup._id ? 'primary.light' : 'action.hover',
                                    }
                                  }}
                                  onClick={() => handleSelectSubGroup(group._id, subGroup)}
                                  selected={selectedSubGroup && selectedSubGroup._id === subGroup._id}
                                >
                                  <Folder fontSize="small" />
                                  <Typography
                                    variant="body2"
                                    color={selectedSubGroup && selectedSubGroup._id === subGroup._id ? 'primary.main' : 'text.primary'}
                                    noWrap
                                  >
                                    {subGroup.name}
                                  </Typography>
                                </ListItemButton>
                              </Tooltip>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </Box>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </ScrollableBox>
      </Grid>

      {/* Right Panel - Resource Display */}
      <Grid item xs={12} md={8} lg={9}>
        <ScrollableBox>
          <ResourceRightPanel
            selectedMainGroup={selectedMainGroup}
            selectedSubGroup={selectedSubGroup}
            resources={filteredResources}
            loading={loading}
            mainGroups={mainGroups}
            subGroups={subGroups}
            onMainGroupClick={setSelectedMainGroup}
            onViewResource={handlePreviewResource}
            onDownloadResource={handleDownloadResource}
            onWatchVideo={handleWatchVideo}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOption={sortOption}
            setSortOption={setSortOption}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            setPage={setPage}
          />
        </ScrollableBox>
      </Grid>

      {/* Resource Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        aria-labelledby="resource-preview-dialog"
        PaperProps={{ sx: { borderRadius: 3, p: 0 } }}
      >
        {previewResource && (
          <>
            <DialogTitle id="resource-preview-dialog" sx={{ bgcolor: '#f8faff', borderBottom: '1px solid', borderColor: 'divider', py: 2, px: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} color="primary.main">
                  Resource Details
                </Typography>
                <IconButton onClick={handleClosePreview} size="small" sx={{ color: 'text.secondary' }}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ px: 3, py: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={7}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {previewResource.title}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {previewResource.categories && previewResource.categories.map(cat => (
                      <Chip 
                        key={cat} 
                        label={cat} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                    {previewResource.description || 'No description provided.'}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Added on {previewResource.createdAt ? format(new Date(previewResource.createdAt), 'MMMM d, yyyy') : 'Unknown date'}
                    </Typography>
                  </Box>
                  {/* Video Preview */}
                  {previewResource.videoLink && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <YouTube color="error" /> Video Resource
                      </Typography>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box 
                          sx={{ 
                            position: 'relative', 
                            width: '100%',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'black',
                            '&::before': {
                              content: '""',
                              display: 'block',
                              paddingTop: '56.25%', // 16:9 aspect ratio
                            }
                          }}
                        >
                          {previewResource.videoThumbnail ? (
                            <img 
                              src={previewResource.videoThumbnail} 
                              alt={previewResource.title} 
                              style={{ width: '100%', borderRadius: 8, display: 'block' }} 
                            />
                          ) : (
                            <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <YouTube sx={{ fontSize: 80, color: 'rgba(255,255,255,0.2)' }} />
                            </Box>
                          )}
                          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IconButton 
                              sx={{ bgcolor: 'rgba(0,0,0,0.7)', color: 'white', '&:hover': { bgcolor: 'error.main' } }}
                              href={previewResource.videoLink}
                              target="_blank"
                            >
                              <YouTube fontSize="large" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Button 
                          variant="contained" 
                          color="error" 
                          startIcon={<YouTube />} 
                          sx={{ mt: 2 }}
                          href={previewResource.videoLink}
                          target="_blank"
                          fullWidth
                        >
                          Watch Video
                        </Button>
                      </Paper>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={5}>
                  {/* File Resource */}
                  {previewResource.fileUrl && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <InsertDriveFile color="primary" /> File Resource
                      </Typography>
                      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            variant="rounded" 
                            sx={{ 
                              width: 60, 
                              height: 60,
                              bgcolor: previewResource.fileUrl.endsWith('.pdf') ? 'error.lighter' :
                                      previewResource.fileUrl.endsWith('.doc') || previewResource.fileUrl.endsWith('.docx') ? 'primary.lighter' :
                                      previewResource.fileUrl.endsWith('.ppt') || previewResource.fileUrl.endsWith('.pptx') ? 'warning.lighter' :
                                      'grey.200'
                            }}
                          >
                            {previewResource.fileUrl.endsWith('.pdf') ? <PictureAsPdf color="error" /> :
                             previewResource.fileUrl.endsWith('.doc') || previewResource.fileUrl.endsWith('.docx') ? <InsertDriveFile color="primary" /> :
                             previewResource.fileUrl.endsWith('.ppt') || previewResource.fileUrl.endsWith('.pptx') ? <InsertDriveFile color="warning" /> :
                             <InsertDriveFile />}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {previewResource.fileUrl.split('/').pop()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {previewResource.fileUrl.split('.').pop().toUpperCase()} File
                            </Typography>
                          </Box>
                        </Box>
                        <Button 
                          variant="contained" 
                          startIcon={<Download />}
                          sx={{ mt: 2 }}
                          fullWidth
                          onClick={() => {
                            if (previewResource.fileUrl) {
                              try {
                                toast.info('Starting download...');
                                let downloadUrl = previewResource.fileUrl.trim();
                                if (downloadUrl.startsWith('/uploads/')) {
                                  const baseUrl = window.location.origin;
                                  downloadUrl = `${baseUrl}${downloadUrl}`;
                                }
                                fetch(downloadUrl)
                                  .then(response => {
                                    if (!response.ok) {
                                      throw new Error(`HTTP error! Status: ${response.status}`);
                                    }
                                    return response.blob();
                                  })
                                  .then(blob => {
                                    const blobUrl = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = blobUrl;
                                    const fileName = previewResource.fileUrl.split('/').pop() || previewResource.title || 'download';
                                    link.setAttribute('download', fileName);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                    toast.success('Download complete!');
                                  })
                                  .catch(error => {
                                    console.error('Download error:', error);
                                    toast.error(`Download failed: ${error.message}`);
                                  });
                              } catch (error) {
                                console.error('Download error:', error);
                                toast.error('Download failed. Please try again.');
                              }
                            }
                          }}
                        >
                          Download
                        </Button>
                      </Paper>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Grid>
  );
};

export default StudyResources;
