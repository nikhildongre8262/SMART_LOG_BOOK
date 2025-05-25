import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Typography, List, ListItem, ListItemButton, ListItemText, 
  Divider, Button, Collapse, Paper, CircularProgress, IconButton, 
  Grid, Chip, Fade, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, InputAdornment, Accordion, AccordionSummary, AccordionDetails, 
  Avatar, Breadcrumbs, Card, CardContent, CardMedia, CardActions, 
  Menu, MenuItem, Tooltip, Select, FormControl, InputLabel, CardActionArea,
  Checkbox, FormGroup, FormControlLabel, Badge, Tab, Tabs, Snackbar, Alert,
  Stack, ListItemIcon, Switch, Pagination, OutlinedInput, LinearProgress
} from '@mui/material';
import { 
  ExpandLess, ExpandMore, AddCircle, Delete, UploadFile, Link as LinkIcon, 
  Close, Search, FilterList, Edit, MoreVert, Download, YouTube, Category,
  CalendarToday, Sort, CheckCircle, Visibility, Share, PictureAsPdf, InsertDriveFile,
  Settings, InsertLink, CloudUpload, DateRange, Refresh, HighlightOff, School
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import AdminNavbar from '../../../components/AdminNavbar';
import AdminSidebar from '../../../components/AdminSidebar.js';
import { toast } from 'react-toastify';
import debounce from 'lodash/debounce';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const StudyResourceDashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Groups and navigation state
  const [mainGroups, setMainGroups] = useState([]);
  const [expandedMainGroup, setExpandedMainGroup] = useState(null);
  const [subGroups, setSubGroups] = useState({});
  const [selectedSubGroup, setSelectedSubGroup] = useState(null);
  
  // Resources state
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [totalResources, setTotalResources] = useState(0);
  const [selectedResources, setSelectedResources] = useState([]);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // UI control states
  const [showForm, setShowForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editResourceId, setEditResourceId] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [resourceActionsAnchorEl, setResourceActionsAnchorEl] = useState(null);
  const [selectedResourceForAction, setSelectedResourceForAction] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewResource, setPreviewResource] = useState(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    categories: [],
    dateRange: {
      startDate: '',
      endDate: '',
    },
    fileTypes: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  
  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    file: null,
    videoLink: '',
    categories: [],
    categoryInput: ''
  });
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [filePreview, setFilePreview] = useState('');
  
  // Statistics state
  const [resourceStats, setResourceStats] = useState({
    total: 0,
    byCategory: {},
    byFileType: {},
    recent: []  
  });

  // Fetch main groups on mount
  useEffect(() => {
    const fetchMainGroups = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/resources/groups`, { headers: { Authorization: `Bearer ${token}` } });
        setMainGroups(res.data.groups);
      } catch (error) {
        console.error('Error fetching groups:', error);
        setMainGroups([]);
        toast.error('Failed to load groups. Please try again.');
      }
      setLoading(false);
    };
    fetchMainGroups();
  }, [token]);

  // Fetch sub-groups for a main group
  const handleExpandMainGroup = async (mainGroupId) => {
    // Toggle the expanded state if clicking the same group
    const newExpandedState = expandedMainGroup === mainGroupId ? null : mainGroupId;
    setExpandedMainGroup(newExpandedState);
    
    // Reset selections when collapsing or changing groups
    if (expandedMainGroup !== mainGroupId) {
      setSelectedSubGroup(null);
      setResources([]);
      setFilteredResources([]);
      setSelectedResources([]);
      resetFilters();
    }
    
    // Load subgroups if they haven't been loaded yet
    if (!subGroups[mainGroupId] && newExpandedState !== null) {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/resources/groups/${mainGroupId}/subgroups`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setSubGroups(prev => ({ ...prev, [mainGroupId]: res.data.subGroups || [] }));
      } catch (error) {
        console.error('Error fetching subgroups:', error);
        setSubGroups(prev => ({ ...prev, [mainGroupId]: [] }));
        toast.error('Failed to load subgroups. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Fetch resources for a sub-group
  const handleSelectSubGroup = async (mainGroupId, subGroup) => {
    setSelectedSubGroup({ ...subGroup, mainGroupId });
    setResources([]);
    setFilteredResources([]);
    setSelectedResources([]);
    resetFilters();
    setPage(1);
    setLoading(true);
    
    try {
      const res = await axios.get(`${API}/resources/${mainGroupId}/${subGroup._id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      const resourceData = res.data.resources || [];
      setResources(resourceData);
      setFilteredResources(resourceData);
      setTotalResources(resourceData.length);
      setTotalPages(Math.ceil(resourceData.length / pageSize));
      
      // Extract all unique categories for filtering
      const categories = new Set();
      resourceData.forEach(resource => {
        if (resource.categories && Array.isArray(resource.categories)) {
          resource.categories.forEach(cat => categories.add(cat));
        }
      });
      setAvailableCategories(Array.from(categories));
      
      // Generate statistics
      calculateResourceStats(resourceData);
      
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
      setFilteredResources([]);
      toast.error('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate statistics for the resources
  const calculateResourceStats = (resourceData) => {
    setStatsLoading(true);
    try {
      const stats = {
        total: resourceData.length,
        byCategory: {},
        byFileType: {
          documents: 0,
          videos: 0,
          others: 0
        },
        recent: resourceData.slice(0, 5)
      };
      
      resourceData.forEach(resource => {
        // Count by category
        if (resource.categories && Array.isArray(resource.categories)) {
          resource.categories.forEach(cat => {
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
          });
        }
        
        // Count by file type
        if (resource.videoLink) {
          stats.byFileType.videos++;
        } else if (resource.fileUrl) {
          const ext = resource.fileUrl.split('.').pop().toLowerCase();
          if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt'].includes(ext)) {
            stats.byFileType.documents++;
          } else {
            stats.byFileType.others++;
          }
        } else {
          stats.byFileType.others++;
        }
      });
      
      setResourceStats(stats);
    } catch (error) {
      console.error('Error calculating resource stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilters({
      categories: [],
      dateRange: {
        startDate: '',
        endDate: '',
      },
      fileTypes: [],
    });
    setSortOption('newest');
  };

  // Apply search and filters to resources
  useEffect(() => {
    if (!resources.length) return;
    
    let filtered = [...resources];
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
    setTotalResources(filtered.length);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    
    // Reset to first page when filters change
    if (page !== 1) {
      setPage(1);
    }
  }, [resources, searchQuery, filters, sortOption, pageSize, page]);
  
  // Handle search input with debounce
  const handleSearchChange = debounce((event) => {
    setSearchQuery(event.target.value);
  }, 300);
  
  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      if (filterType === 'categories' || filterType === 'fileTypes') {
        const currentValues = prev[filterType];
        let newValues;
        
        if (currentValues.includes(value)) {
          // Remove the value
          newValues = currentValues.filter(v => v !== value);
        } else {
          // Add the value
          newValues = [...currentValues, value];
        }
        
        return { ...prev, [filterType]: newValues };
      } else if (filterType === 'dateRange') {
        return { ...prev, dateRange: { ...prev.dateRange, ...value } };
      }
      
      return prev;
    });
  };
  
  // Handle sort option change
  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  // Video thumbnail preview
  useEffect(() => {
    if (form.videoLink) {
      if (form.videoLink.includes('youtube.com') || form.videoLink.includes('youtu.be')) {
        const match = form.videoLink.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})/);
        if (match && match[1]) {
          setVideoThumbnail(`https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`);
        } else {
          setVideoThumbnail('');
        }
      } else if (form.videoLink.includes('vimeo.com')) {
        setVideoThumbnail('');
      } else {
        setVideoThumbnail('');
      }
    } else {
      setVideoThumbnail('');
    }
  }, [form.videoLink]);

  useEffect(() => {
    if (form.file) {
      setFilePreview(form.file.name);
    } else {
      setFilePreview('');
    }
  }, [form.file]);

  // Resource action handlers
  const handleOpenResourceMenu = (event, resource) => {
    setResourceActionsAnchorEl(event.currentTarget);
    setSelectedResourceForAction(resource);
  };

  const handleCloseResourceMenu = () => {
    setResourceActionsAnchorEl(null);
    setSelectedResourceForAction(null);
  };

  const handlePreviewResource = (resource) => {
    setPreviewResource(resource);
    setShowPreview(true);
    handleCloseResourceMenu();
  };

  const handleEditResource = (resource) => {
    // Set form for editing
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      file: null, // Can't pre-populate file input
      existingFile: resource.fileUrl || '',
      videoLink: resource.videoLink || '',
      categories: resource.categories || [],
      categoryInput: ''
    });
    setIsEditMode(true);
    setEditResourceId(resource._id);
    setShowForm(true);
    handleCloseResourceMenu();
  };

  // Multi-select resource handlers
  const handleSelectResource = (resourceId) => {
    setSelectedResources(prev => {
      if (prev.includes(resourceId)) {
        return prev.filter(id => id !== resourceId);
      } else {
        return [...prev, resourceId];
      }
    });
  };

  const handleSelectAllResources = () => {
    if (selectedResources.length === filteredResources.length) {
      setSelectedResources([]);
    } else {
      setSelectedResources(filteredResources.map(r => r._id));
    }
  };

  const handleDeleteMultipleResources = async () => {
    if (selectedResources.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedResources.length} selected resource(s)?`)) return;
    
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;
    
    // Delete resources one by one
    for (const id of selectedResources) {
      try {
        await axios.delete(`${API}/resources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        successCount++;
      } catch (error) {
        console.error(`Error deleting resource ${id}:`, error);
        errorCount++;
      }
    }
    
    // Show status message
    if (successCount > 0) {
      toast.success(`Successfully deleted ${successCount} resource(s)`);
    }
    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} resource(s)`);
    }
    
    // Refresh resources
    if (expandedMainGroup && selectedSubGroup) {
      try {
        const res = await axios.get(`${API}/resources/${expandedMainGroup}/${selectedSubGroup._id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setResources(res.data.resources || []);
      } catch (error) {
        console.error('Error refreshing resources:', error);
      }
    }
    
    setSelectedResources([]);
    setLoading(false);
  };

  // Form handlers
  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleFileChange = e => {
    setForm(prev => ({ ...prev, file: e.target.files[0] }));
  };
  
  const handleAddCategory = () => {
    if (form.categoryInput && !form.categories.includes(form.categoryInput)) {
      setForm(prev => ({ ...prev, categories: [...prev.categories, prev.categoryInput], categoryInput: '' }));
    }
  };
  
  const handleDeleteCategory = (cat) => {
    setForm(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
  };
  
  const handleRemoveFile = () => {
    setForm(prev => ({ ...prev, file: null, existingFile: null }));
    setFilePreview('');
  };
  
  const handleRemoveVideo = () => {
    setForm(prev => ({ ...prev, videoLink: '' }));
    setVideoThumbnail('');
  };
  
  const handleOpenForm = () => {
    setIsEditMode(false);
    setEditResourceId(null);
    setForm({ 
      title: '', 
      description: '', 
      file: null, 
      existingFile: '',
      videoLink: '', 
      categories: [], 
      categoryInput: '' 
    });
    setVideoThumbnail('');
    setFilePreview('');
    setShowForm(true);
  };
  
  const handleCloseForm = () => {
    setShowForm(false);
    setIsEditMode(false);
    setEditResourceId(null);
    setForm({ 
      title: '', 
      description: '', 
      file: null, 
      existingFile: '',
      videoLink: '', 
      categories: [], 
      categoryInput: '' 
    });
    setVideoThumbnail('');
    setFilePreview('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required');
    if (!expandedMainGroup || !selectedSubGroup) return toast.error('Select a group and sub-group');
    
    setFormLoading(true);
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('groupId', expandedMainGroup);
    formData.append('subGroupId', selectedSubGroup._id);
    
    // Only append file if a new one is selected
    if (form.file) formData.append('file', form.file);
    if (form.videoLink) formData.append('videoLink', form.videoLink);
    if (form.categories.length) formData.append('categories', form.categories.join(','));
    
    try {
      if (isEditMode && editResourceId) {
        // Update existing resource
        if (!form.file && !form.existingFile && !form.videoLink) {
          // Add flag to indicate file should be removed if there's no replacement
          formData.append('removeFile', 'true');
        }
        
        await axios.put(`${API}/resources/${editResourceId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Resource updated');
      } else {
        // Create new resource
        await axios.post(`${API}/resources`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success('Resource added');
      }
      
      handleCloseForm();
      
      // Refresh resources
      if (expandedMainGroup && selectedSubGroup) {
        const res = await axios.get(`${API}/resources/${expandedMainGroup}/${selectedSubGroup._id}`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        const resourceData = res.data.resources || [];
        setResources(resourceData);
        setFilteredResources(resourceData);
        calculateResourceStats(resourceData);
      }
    } catch (err) {
      console.error('Error submitting resource:', err);
      toast.error(isEditMode ? 'Failed to update resource' : 'Failed to add resource');
    } finally {
      setFormLoading(false);
    }
  };
  
  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    setLoading(true);
    
    try {
      await axios.delete(`${API}/resources/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      
      // Update both resources and filtered resources
      const updatedResources = resources.filter(res => res._id !== id);
      setResources(updatedResources);
      setFilteredResources(prev => prev.filter(res => res._id !== id));
      
      // Update statistics
      calculateResourceStats(updatedResources);
      
      toast.success('Resource deleted');
    } catch (err) {
      console.error('Error deleting resource:', err);
      toast.error('Failed to delete resource');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewResource(null);
  };

  return (
    <>
      <AdminNavbar user={user} />
      <AdminSidebar selected="study-resource" />
      <Box sx={{ display: 'flex', minHeight: '100vh', background: '#f4f6fa' }}>
        <Fade in timeout={500}>
          <Box sx={{ flex: 1, p: 3, ml: '220px', width: '100%', mt: '64px' }}>
            {/* Header Section */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h5" fontWeight="bold" color="primary">Study Resources Management</Typography>
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
                    Study Resources
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
                  Manage your study resources across groups and subgroups. Add new materials, organize by categories, and keep your educational content up to date.
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
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <School fontSize="small" /> Groups & Subgroups
                    </Typography>
                    <Tooltip title="Refresh groups">
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setLoading(true);
                          // Fetch groups again
                          axios.get(`${API}/resources/groups`, { headers: { Authorization: `Bearer ${token}` } })
                            .then(res => {
                              setMainGroups(res.data.groups);
                              setLoading(false);
                            })
                            .catch(err => {
                              console.error('Error refreshing groups:', err);
                              setLoading(false);
                              toast.error('Failed to refresh groups');
                            });
                        }}
                        color="primary"
                        sx={{ bgcolor: 'primary.lighter' }}
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {loading && <LinearProgress sx={{ mb: 2 }} />}
                  
                  {/* No groups message */}
                  {!loading && mainGroups.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                      <Avatar sx={{ mx: 'auto', mb: 2, width: 70, height: 70, bgcolor: 'primary.lighter' }}>
                        <School sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={600} color="text.secondary" gutterBottom>
                        No Groups Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        You haven't created any groups yet. Groups are needed to organize your study resources.
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
                          {loading && !subGroups[mainGroup._id] ? (
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
                                Select a subgroup to view its resources:
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
              {/* Resources Display Panel */}
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
                          <Category fontSize="small" /> {selectedSubGroup.name} Resources
                        </Typography>
                        <Button 
                          variant="contained" 
                          startIcon={<AddCircle />} 
                          onClick={handleOpenForm}
                          size="small"
                          sx={{ borderRadius: 1.5 }}
                        >
                          Add Resource
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="h6" fontWeight={700} color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Category fontSize="small" /> Study Resources
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
                              placeholder="Search resources..."
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
                              Filters {filters.categories.length > 0 || filters.fileTypes.length > 0 || filters.dateRange.startDate ? 
                                `(${filters.categories.length + filters.fileTypes.length + (filters.dateRange.startDate ? 1 : 0)})` : ''}
                            </Button>
                          </Grid>
                        </Grid>
                        
                        {/* Expanded Filters */}
                        <Collapse in={showFilters}>
                          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Grid container spacing={2}>
                              {/* Category Filters */}
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>Categories</Typography>
                                <FormGroup sx={{ ml: 1 }}>
                                  {availableCategories.length > 0 ? (
                                    availableCategories.map(category => (
                                      <FormControlLabel
                                        key={category}
                                        control={
                                          <Checkbox 
                                            size="small" 
                                            checked={filters.categories.includes(category)}
                                            onChange={() => handleFilterChange('categories', category)} 
                                          />
                                        }
                                        label={<Typography variant="body2">{category}</Typography>}
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">No categories available</Typography>
                                  )}
                                </FormGroup>
                              </Grid>
                              
                              {/* File Type Filters */}
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>Resource Type</Typography>
                                <FormGroup sx={{ ml: 1 }}>
                                  <FormControlLabel
                                    control={
                                      <Checkbox 
                                        size="small" 
                                        checked={filters.fileTypes.includes('documents')}
                                        onChange={() => handleFilterChange('fileTypes', 'documents')} 
                                      />
                                    }
                                    label={<Typography variant="body2">Documents</Typography>}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Checkbox 
                                        size="small" 
                                        checked={filters.fileTypes.includes('videos')}
                                        onChange={() => handleFilterChange('fileTypes', 'videos')} 
                                      />
                                    }
                                    label={<Typography variant="body2">Videos</Typography>}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Checkbox 
                                        size="small" 
                                        checked={filters.fileTypes.includes('others')}
                                        onChange={() => handleFilterChange('fileTypes', 'others')} 
                                      />
                                    }
                                    label={<Typography variant="body2">Others</Typography>}
                                  />
                                </FormGroup>
                              </Grid>
                              
                              {/* Date Filters */}
                              <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" gutterBottom>Date Range</Typography>
                                <Stack spacing={2} sx={{ mt: 1 }}>
                                  <TextField
                                    label="From"
                                    type="date"
                                    size="small"
                                    value={filters.dateRange.startDate}
                                    onChange={(e) => handleFilterChange('dateRange', { startDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                  />
                                  <TextField
                                    label="To"
                                    type="date"
                                    size="small"
                                    value={filters.dateRange.endDate}
                                    onChange={(e) => handleFilterChange('dateRange', { endDate: e.target.value })}
                                    InputLabelProps={{ shrink: true }}
                                    fullWidth
                                  />
                                </Stack>
                              </Grid>
                            </Grid>
                            
                            {/* Filter Actions */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                              <Button 
                                size="small" 
                                onClick={resetFilters} 
                                startIcon={<HighlightOff />} 
                                color="inherit"
                                sx={{ mr: 1 }}
                              >
                                Clear Filters
                              </Button>
                            </Box>
                          </Box>
                        </Collapse>
                      </Paper>
                      
                      {/* Selected Resources Actions */}
                      {selectedResources.length > 0 && (
                        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2">
                            {selectedResources.length} {selectedResources.length === 1 ? 'resource' : 'resources'} selected
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small"
                            startIcon={<Delete />}
                            onClick={handleDeleteMultipleResources}
                          >
                            Delete Selected
                          </Button>
                        </Box>
                      )}
                      
                      {/* Resource Stats Section */}
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
                                <InsertDriveFile />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="primary.main">
                                  {filteredResources.length}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Total Resources
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
                                <PictureAsPdf />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                  {resourceStats.byFileType.documents || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Documents
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
                                <YouTube />
                              </Avatar>
                              <Box>
                                <Typography variant="h5" fontWeight="bold" color="warning.main">
                                  {resourceStats.byFileType.videos || 0}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Videos
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Resource Content Area */}
                  {!selectedSubGroup ? (
                    // No subgroup selected state
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 6 }}>
                      <Avatar sx={{ width: 80, height: 80, mb: 3, bgcolor: 'primary.lighter' }}>
                        <Category sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="h6" align="center" gutterBottom>
                        Select a subgroup to view resources
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 500, mb: 3 }}>
                        Choose a group and subgroup from the left panel to view and manage study resources. You can add, edit, and organize resources by category.
                      </Typography>
                    </Box>
                  ) : loading ? (
                    // Loading state
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                      <CircularProgress />
                    </Box>
                  ) : filteredResources.length === 0 ? (
                    // Empty state
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, py: 4 }}>
                      <Avatar sx={{ width: 70, height: 70, mb: 2, bgcolor: 'primary.lighter' }}>
                        <InsertDriveFile sx={{ fontSize: 35, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="h6" align="center" gutterBottom>
                        No resources found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3, maxWidth: 400 }}>
                        {searchQuery || filters.categories.length > 0 || filters.fileTypes.length > 0 || filters.dateRange.startDate ? 
                          'No resources match your search criteria. Try adjusting your filters.' : 
                          `There are no resources in the "${selectedSubGroup.name}" subgroup yet. Add your first resource using the button above.`}
                      </Typography>
                      {(searchQuery || filters.categories.length > 0 || filters.fileTypes.length > 0 || filters.dateRange.startDate) && (
                        <Button variant="outlined" startIcon={<Refresh />} onClick={resetFilters}>Clear Filters</Button>
                      )}
                    </Box>
                  ) : (
                    // Resources Grid View
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                      <Grid container spacing={2}>
                        {filteredResources
                          .slice((page - 1) * pageSize, page * pageSize)
                          .map(resource => (
                          <Grid item xs={12} sm={6} key={resource._id}>
                            <Card 
                              elevation={0} 
                              sx={{ 
                                borderRadius: 2, 
                                border: '1px solid', 
                                borderColor: 'divider',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                '&:hover': {
                                  boxShadow: 2
                                }
                              }}
                            >
                              {/* Resource Selection Checkbox */}
                              <Checkbox
                                size="small"
                                checked={selectedResources.includes(resource._id)}
                                onChange={() => handleSelectResource(resource._id)}
                                sx={{ position: 'absolute', top: 5, left: 5, zIndex: 1 }}
                              />
                              
                              {/* Resource Preview */}
                              {resource.videoThumbnail ? (
                                <CardMedia
                                  component="img"
                                  height="140"
                                  image={resource.videoThumbnail}
                                  alt={resource.title}
                                  sx={{ objectFit: 'cover' }}
                                />
                              ) : resource.fileUrl ? (
                                <Box sx={{ 
                                  height: 140, 
                                  display: 'flex', 
                                  flexDirection: 'column',
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  bgcolor: resource.fileUrl.endsWith('.pdf') ? 'error.lighter' :
                                           resource.fileUrl.endsWith('.doc') || resource.fileUrl.endsWith('.docx') ? 'primary.lighter' :
                                           resource.fileUrl.endsWith('.ppt') || resource.fileUrl.endsWith('.pptx') ? 'warning.lighter' :
                                           'grey.100',
                                  position: 'relative',
                                  overflow: 'hidden'
                                }}>
                                  {/* Document extension label */}
                                  <Box 
                                    sx={{
                                      position: 'absolute',
                                      top: 5,
                                      right: 5,
                                      bgcolor: 'rgba(255,255,255,0.8)',
                                      px: 1,
                                      py: 0.5,
                                      borderRadius: 1,
                                      fontSize: '0.7rem',
                                      fontWeight: 'bold',
                                      color: resource.fileUrl.endsWith('.pdf') ? 'error.main' :
                                              resource.fileUrl.endsWith('.doc') || resource.fileUrl.endsWith('.docx') ? 'primary.main' :
                                              resource.fileUrl.endsWith('.ppt') || resource.fileUrl.endsWith('.pptx') ? 'warning.main' :
                                              'text.secondary'
                                    }}
                                  >
                                    {resource.fileUrl.endsWith('.pdf') ? 'PDF' :
                                     resource.fileUrl.endsWith('.doc') ? 'DOC' :
                                     resource.fileUrl.endsWith('.docx') ? 'DOCX' :
                                     resource.fileUrl.endsWith('.ppt') ? 'PPT' :
                                     resource.fileUrl.endsWith('.pptx') ? 'PPTX' :
                                     resource.fileUrl.split('.').pop().toUpperCase()}
                                  </Box>
                                  
                                  {/* Document icon */}
                                  <Avatar 
                                    variant="rounded" 
                                    sx={{ 
                                      width: 70, 
                                      height: 70,
                                      mb: 1,
                                      bgcolor: resource.fileUrl.endsWith('.pdf') ? 'error.main' :
                                              resource.fileUrl.endsWith('.doc') || resource.fileUrl.endsWith('.docx') ? 'primary.main' :
                                              resource.fileUrl.endsWith('.ppt') || resource.fileUrl.endsWith('.pptx') ? 'warning.main' :
                                              'grey.500'
                                    }}
                                  >
                                    {resource.fileUrl.endsWith('.pdf') ? <PictureAsPdf sx={{ fontSize: 40, color: 'white' }} /> :
                                     resource.fileUrl.endsWith('.doc') || resource.fileUrl.endsWith('.docx') ? <InsertDriveFile sx={{ fontSize: 40, color: 'white' }} /> :
                                     resource.fileUrl.endsWith('.ppt') || resource.fileUrl.endsWith('.pptx') ? <InsertDriveFile sx={{ fontSize: 40, color: 'white' }} /> :
                                     <InsertDriveFile sx={{ fontSize: 40, color: 'white' }} />}
                                  </Avatar>
                                  
                                  {/* Filename preview */}
                                  <Typography variant="caption" sx={{ fontWeight: 500, px: 2, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                                    {resource.fileUrl.split('/').pop()}
                                  </Typography>
                                </Box>
                              
                              ) : (
                                <Box sx={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
                                  <Typography variant="subtitle2" color="text.secondary">No Preview</Typography>
                                </Box>
                              )}
                              
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                                  {resource.title}
                                </Typography>
                                
                                {resource.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                                    {resource.description.length > 80 ? 
                                      resource.description.substring(0, 80) + '...' : 
                                      resource.description}
                                  </Typography>
                                )}
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5, minHeight: 32 }}>
                                  {resource.categories && resource.categories.map(cat => (
                                    <Chip 
                                      key={cat} 
                                      label={cat} 
                                      size="small" 
                                      variant="outlined"
                                      color="primary"
                                      sx={{ fontWeight: 500, fontSize: 11 }} 
                                    />
                                  ))}
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {resource.createdAt ? format(new Date(resource.createdAt), 'MMM d, yyyy') : 'Unknown date'}
                                  </Typography>
                                </Box>
                              </CardContent>
                              
                              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                                <Box>
                                  {resource.fileUrl && (
                                    <Tooltip title="Download">
                                      <IconButton 
                                        size="small" 
                                        color="primary"
                                        onClick={() => {
                                          // Always attempt to download, even for potentially problematic file URLs
                                          if (resource.fileUrl) {
                                            try {
                                              toast.info('Starting download...');
                                              
                                              // Determine the file URL - trim any whitespace
                                              let downloadUrl = resource.fileUrl.trim();
                                              console.log('Original fileUrl:', downloadUrl);
                                              
                                              // Handle local uploads folder URL - add proper server base URL
                                              if (downloadUrl.startsWith('/uploads/')) {
                                                const baseUrl = API.replace('/api', '');
                                                // Ensure there are no double slashes in the URL
                                                downloadUrl = `${baseUrl}${downloadUrl}`;
                                                console.log('Full download URL:', downloadUrl);
                                              }
                                              
                                              // Skip the download if URL contains 'undefined'
                                              if (downloadUrl.includes('undefined')) {
                                                toast.error('Invalid file path detected');
                                                console.error('Invalid file path with undefined:', downloadUrl);
                                                return;
                                              }
                                              
                                              // Extract filename from path or use resource title
                                              let fileName;
                                              try {
                                                fileName = downloadUrl.split('/').pop();
                                                // Additional check to ensure filename is valid
                                                if (!fileName || fileName === 'undefined' || fileName.trim() === '') {
                                                  fileName = resource.title || 'download';
                                                }
                                                // Remove any query parameters from the filename
                                                fileName = fileName.split('?')[0];
                                              } catch (e) {
                                                console.error('Error extracting filename:', e);
                                                fileName = resource.title || 'download';
                                              }
                                              
                                              console.log('Downloading file:', fileName, 'from URL:', downloadUrl);
                                              
                                              // Use the Fetch API for all downloads to handle as a blob
                                              fetch(downloadUrl)
                                                .then(response => {
                                                  if (!response.ok) {
                                                    throw new Error(`HTTP error! Status: ${response.status}`);
                                                  }
                                                  return response.blob();
                                                })
                                                .then(blob => {
                                                  // Verify blob size - if zero, file is likely missing
                                                  if (blob.size === 0) {
                                                    toast.error('File appears to be empty or inaccessible');
                                                    return;
                                                  }
                                                  
                                                  // Create a blob URL and trigger download
                                                  const blobUrl = URL.createObjectURL(blob);
                                                  const link = document.createElement('a');
                                                  link.href = blobUrl;
                                                  link.setAttribute('download', fileName);
                                                  
                                                  // Add to body, click, and remove
                                                  document.body.appendChild(link);
                                                  link.click();
                                                  document.body.removeChild(link);
                                                  
                                                  // Clean up the blob URL
                                                  setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                                                  toast.success('Download complete!');
                                                })
                                                .catch(error => {
                                                  console.error('Download error:', error);
                                                  toast.error(`Download failed: ${error.message}`);
                                                  
                                                  // Show more detailed error to help debugging
                                                  console.log('Download URL was:', downloadUrl);
                                                  
                                                  // Fallback method - try direct download
                                                  toast.info('Trying alternative download method...');
                                                  const link = document.createElement('a');
                                                  // If we're dealing with a local upload, add CORS header by appending a timestamp
                                                  if (downloadUrl.includes('/uploads/')) {
                                                    link.href = `${downloadUrl}?t=${Date.now()}`;
                                                  } else {
                                                    link.href = downloadUrl;
                                                  }
                                                  link.setAttribute('download', fileName);
                                                  link.target = '_blank'; // Open in new tab as last resort
                                                  document.body.appendChild(link);
                                                  link.click();
                                                  document.body.removeChild(link);
                                                });
                                              
                                            } catch (error) {
                                              console.error('Download initialization error:', error);
                                              toast.error('Download failed. Please try again.');
                                            }
                                          } else {
                                            console.error('Invalid file URL:', resource.fileUrl);
                                            toast.error('File not available for download');
                                          }
                                        }}
                                      >
                                        <Download fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  {resource.videoLink && (
                                    <Tooltip title="Open Video">
                                      <IconButton 
                                        size="small" 
                                        color="error"
                                        href={resource.videoLink} 
                                        target="_blank"
                                      >
                                        <YouTube fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Preview">
                                    <IconButton 
                                      size="small" 
                                      onClick={() => handlePreviewResource(resource)}
                                    >
                                      <Visibility fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                                
                                <Box>
                                  <Tooltip title="Edit">
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleEditResource(resource)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton 
                                      size="small" 
                                      color="error"
                                      onClick={() => handleDeleteResource(resource._id)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </CardActions>
                            </Card>
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
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Fade>
        
        {/* Add/Edit Resource Dialog */}
        <Dialog 
          open={showForm} 
          onClose={handleCloseForm} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: 'hidden'
            }
          }}
        >
          <DialogTitle sx={{ px: 3, py: 2, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', gap: 1 }}>
            <InsertDriveFile color="primary" />
            <Typography variant="h6" component="div" fontWeight={700} color="primary.main">
              {isEditMode ? 'Edit Resource' : 'Add New Resource'}
            </Typography>
          </DialogTitle>
          
          {formLoading && <LinearProgress />}
          
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField 
                    label="Title" 
                    name="title" 
                    value={form.title} 
                    onChange={handleFormChange} 
                    required 
                    fullWidth 
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InsertDriveFile color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField 
                    label="Description" 
                    name="description" 
                    value={form.description} 
                    onChange={handleFormChange} 
                    fullWidth 
                    multiline 
                    rows={3} 
                    placeholder="Enter a description for this resource"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CloudUpload fontSize="small" color="primary" /> Resource Files
                  </Typography>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      border: '1px dashed', 
                      borderColor: 'divider', 
                      borderRadius: 2,
                      bgcolor: 'background.default'
                    }}
                  >
                    <Grid container spacing={2}>
                      {/* File Upload Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'white' }}>
                          <Typography variant="subtitle2" gutterBottom>Upload Document</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1.5 }}>
                            <Button 
                              variant={filePreview ? "outlined" : "contained"} 
                              component="label" 
                              startIcon={<UploadFile />}
                              size="small"
                              sx={{ mr: 2 }}
                            >
                              {filePreview ? 'Change File' : 'Select File'}
                              <input type="file" hidden onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx,.xlsx,.xls,image/*" />
                            </Button>
                            {isEditMode && form.existingFile && !form.file && !filePreview && (
                              <Typography variant="body2" color="text.secondary">
                                Current: {form.existingFile.split('/').pop()}
                              </Typography>
                            )}
                            {filePreview && (
                              <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                                <Typography variant="body2" sx={{ maxWidth: '150px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {filePreview}
                                </Typography>
                                <IconButton size="small" onClick={handleRemoveFile}>
                                  <Close fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLSX, XLS and Images
                          </Typography>
                        </Box>
                      </Grid>
                      
                      {/* Video Link Section */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'white' }}>
                          <Typography variant="subtitle2" gutterBottom>Video Link</Typography>
                          <TextField 
                            placeholder="YouTube or Vimeo URL" 
                            name="videoLink" 
                            value={form.videoLink} 
                            onChange={handleFormChange} 
                            fullWidth
                            size="small"
                            sx={{ mb: 1.5 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <YouTube fontSize="small" color="error" />
                                </InputAdornment>
                              ),
                              endAdornment: form.videoLink && (
                                <InputAdornment position="end">
                                  <IconButton size="small" onClick={handleRemoveVideo}>
                                    <Close fontSize="small" />
                                  </IconButton>
                                </InputAdornment>
                              )
                            }} 
                          />
                          {videoThumbnail ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                              <img src={videoThumbnail} alt="thumbnail" style={{ width: 100, borderRadius: 4 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                                Thumbnail preview
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Add a YouTube or Vimeo video link
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Category fontSize="small" color="primary" /> Categories
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField 
                      placeholder="Enter category name" 
                      value={form.categoryInput} 
                      onChange={e => setForm(prev => ({ ...prev, categoryInput: e.target.value }))} 
                      size="small"
                      sx={{ mr: 2 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Category fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && form.categoryInput) {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={handleAddCategory}
                      disabled={!form.categoryInput}
                      startIcon={<AddCircle />}
                    >
                      Add
                    </Button>
                  </Box>
                  
                  {/* Category Chips */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {form.categories.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No categories added. Add categories to help organize this resource.
                      </Typography>
                    ) : (
                      form.categories.map(cat => (
                        <Chip 
                          key={cat} 
                          label={cat} 
                          onDelete={() => handleDeleteCategory(cat)} 
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ borderRadius: 1 }} 
                        />
                      ))
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          
          <Box sx={{ bgcolor: 'background.default', px: 3, py: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseForm} sx={{ mr: 1 }} startIcon={<Close />}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={formLoading || !form.title} 
              startIcon={isEditMode ? <Edit /> : <AddCircle />}
            >
              {isEditMode ? 'Update Resource' : 'Save Resource'}
            </Button>
          </Box>
        </Dialog>
        
        {/* Resource Preview Dialog */}
        <Dialog 
          open={showPreview} 
          onClose={handleClosePreview} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              overflow: 'hidden'
            }
          }}
        >
          {previewResource && (
            <>
              <DialogTitle sx={{ px: 3, py: 2, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Visibility color="primary" />
                <Typography variant="h6" component="div" fontWeight={700} color="primary.main">
                  Resource Preview
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                <IconButton size="small" onClick={handleClosePreview}>
                  <Close />
                </IconButton>
              </DialogTitle>
              
              <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>{previewResource.title}</Typography>
                    
                    {previewResource.description && (
                      <Typography variant="body1" paragraph>
                        {previewResource.description}
                      </Typography>
                    )}
                    
                    {/* Resource Preview Section */}
                    {previewResource.videoThumbnail && (
                      <Box sx={{ mt: 2, mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <YouTube color="error" /> Video Preview
                        </Typography>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                          }}
                        >
                          <Box sx={{ position: 'relative', width: '100%', maxWidth: 500, mx: 'auto' }}>
                            <img 
                              src={previewResource.videoThumbnail} 
                              alt="Video thumbnail" 
                              style={{ width: '100%', borderRadius: 8, display: 'block' }} 
                            />
                            <Box 
                              sx={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                right: 0, 
                                bottom: 0, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center' 
                              }}
                            >
                              <IconButton 
                                sx={{ 
                                  bgcolor: 'rgba(0,0,0,0.7)', 
                                  color: 'white',
                                  '&:hover': { bgcolor: 'error.main' } 
                                }}
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
                          >
                            Watch Video
                          </Button>
                        </Paper>
                      </Box>
                    )}
                    
                    {previewResource.fileUrl && (
                      <Box sx={{ mt: 2, mb: 3 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <InsertDriveFile color="primary" /> File Resource
                        </Typography>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            border: '1px solid', 
                            borderColor: 'divider'
                          }}
                        >
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
                            <Button 
                              variant="contained" 
                              startIcon={<Download />}
                              onClick={() => {
                                // Use the same download function as the main resource cards
                                if (previewResource.fileUrl) {
                                  try {
                                    toast.info('Starting download...');
                                    
                                    // Determine the file URL - trim any whitespace
                                    let downloadUrl = previewResource.fileUrl.trim();
                                    
                                    // Handle local uploads folder URL - add proper server base URL
                                    if (downloadUrl.startsWith('/uploads/')) {
                                      const baseUrl = API.replace('/api', '');
                                      downloadUrl = `${baseUrl}${downloadUrl}`;
                                    }
                                    
                                    // Extract filename from path or use resource title
                                    const fileName = downloadUrl.split('/').pop() || previewResource.title || 'download';
                                    
                                    // Use fetch API for the download
                                    fetch(downloadUrl)
                                      .then(response => {
                                        if (!response.ok) {
                                          throw new Error(`HTTP error! Status: ${response.status}`);
                                        }
                                        return response.blob();
                                      })
                                      .then(blob => {
                                        // Create a blob URL and trigger download
                                        const blobUrl = URL.createObjectURL(blob);
                                        const link = document.createElement('a');
                                        link.href = blobUrl;
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
                          </Box>
                        </Paper>
                      </Box>
                    )}
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        borderRadius: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        bgcolor: 'background.default'
                      }}
                    >
                      <Typography variant="subtitle2" gutterBottom fontWeight={600}>Resource Details</Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2">
                          Added: {previewResource.createdAt ? new Date(previewResource.createdAt).toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}) : 'Unknown'}
                        </Typography>
                      </Box>
                      
                      {previewResource.categories && previewResource.categories.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
                            <Category fontSize="small" color="primary" /> Categories
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {previewResource.categories.map(cat => (
                              <Chip 
                                key={cat} 
                                label={cat} 
                                size="small" 
                                variant="outlined"
                                color="primary" 
                              />
                            ))}
                          </Box>
                        </>
                      )}
                      
                      <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                        <Button 
                          variant="outlined" 
                          startIcon={<Edit />} 
                          size="small"
                          onClick={() => {
                            handleClosePreview();
                            handleEditResource(previewResource);
                          }}
                          fullWidth
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="error"
                          startIcon={<Delete />} 
                          size="small"
                          onClick={() => {
                            handleClosePreview();
                            handleDeleteResource(previewResource._id);
                          }}
                          fullWidth
                        >
                          Delete
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    </>
  );
};

export default StudyResourceDashboard;
