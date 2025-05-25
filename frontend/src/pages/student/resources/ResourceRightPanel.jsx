import React from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  LinearProgress,
  IconButton,
  Tooltip,
  Button,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Pagination
} from '@mui/material';
import {
  Download,
  Notifications,
  Category,
  NavigateNext,
  Close,
  School
} from '@mui/icons-material';
import ResourceCard from './ResourceCard';

const ResourceRightPanel = ({
  selectedMainGroup,
  selectedSubGroup,
  resources,
  loading,
  mainGroups,
  subGroups,
  onMainGroupClick,
  onViewResource,
  onDownloadResource,
  onWatchVideo,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  page,
  pageSize,
  totalPages,
  setPage
}) => {
  // Find the selected main group and subgroup names
  const selectedMainGroupData = mainGroups.find(g => g._id === selectedMainGroup);
  const selectedSubGroupData = selectedMainGroupData?.subGroups?.find(sg => sg._id === selectedSubGroup?._id || sg._id === selectedSubGroup);

  return (
    <Paper 
      elevation={2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: { xs: 0, md: 1 },
        p: 0
      }}
    >
      {/* Heading and Breadcrumb Navigation */}
      <Box sx={{ px: 3, pt: 3, pb: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <School color="primary" sx={{ fontSize: 28, mr: 1 }} />
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Study Resources
          </Typography>
        </Box>
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />} 
          aria-label="group navigation"
          sx={{ mb: 2, ml: 0.5 }}
        >
          <Link
            component="button"
            variant="body1"
            onClick={() => onMainGroupClick(selectedMainGroup)}
            sx={{ 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' },
              pl: 0
            }}
          >
            {selectedMainGroupData?.name || 'Main Group'}
          </Link>
          <Typography color="text.primary">
            {selectedSubGroupData?.name || selectedSubGroup?.name || 'Subgroup'}
          </Typography>
        </Breadcrumbs>
      </Box>
      <Box sx={{ p: 3, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Resources
        </Typography>
        <Box>
          <Tooltip title="Download All">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton>
              <Notifications />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Optional: Resource Stats */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          {resources.length} resources shared
        </Typography>
        {/* You can add a progress bar or more stats here if desired */}
      </Box>

      {/* Search and Sort */}
      <Box sx={{ px: 2, mb: 2, display: 'flex', gap: 1 }}>
        <TextField
          placeholder="Search resources..."
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Category fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 220 }}
        />
        <FormControl size="small">
          <Select
            value={sortOption}
            onChange={e => setSortOption(e.target.value)}
            displayEmpty
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
            <MenuItem value="a-z">A-Z</MenuItem>
            <MenuItem value="z-a">Z-A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {!selectedSubGroup ? (
          <Box 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Avatar sx={{ width: 80, height: 80, mb: 3, bgcolor: 'primary.lighter' }}>
              <Category sx={{ fontSize: 40, color: 'primary.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a subgroup to view resources
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Please select a subgroup from the left panel to view resources
            </Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : resources.length === 0 ? (
          <Box 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Avatar sx={{ width: 70, height: 70, mb: 2, bgcolor: 'primary.lighter' }}>
              <Category sx={{ fontSize: 35, color: 'primary.main' }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Resources
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              No resources have been shared for this subgroup yet
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {resources.slice((page - 1) * pageSize, page * pageSize).map(resource => (
              <Grid item xs={12} md={6} key={resource._id}>
                <ResourceCard
                  resource={resource}
                  onView={onViewResource}
                  onDownload={onDownloadResource}
                  onWatchVideo={onWatchVideo}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={(e, newPage) => setPage(newPage)} 
            color="primary" 
          />
        </Box>
      )}
    </Paper>
  );
};

export default ResourceRightPanel; 