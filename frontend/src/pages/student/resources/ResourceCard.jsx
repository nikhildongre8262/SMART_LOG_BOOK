import React from 'react';
import { Card, CardContent, Typography, Box, Chip, IconButton, Tooltip, CardActions, Avatar, Button } from '@mui/material';
import { Download, Visibility, YouTube, InsertDriveFile, PictureAsPdf } from '@mui/icons-material';
import { format } from 'date-fns';

const getFileTypeIcon = (resource) => {
  if (resource.videoLink) return { icon: <YouTube color="error" />, color: 'error.main', label: 'Video' };
  if (resource.fileUrl) {
    const ext = resource.fileUrl.split('.').pop().toLowerCase();
    if (ext === 'pdf') return { icon: <PictureAsPdf color="error" />, color: 'error.main', label: 'PDF' };
    if (["doc", "docx"].includes(ext)) return { icon: <InsertDriveFile color="primary" />, color: 'primary.main', label: 'DOC' };
    if (["ppt", "pptx"].includes(ext)) return { icon: <InsertDriveFile color="warning" />, color: 'warning.main', label: 'PPT' };
    return { icon: <InsertDriveFile color="action" />, color: 'grey.700', label: ext.toUpperCase() };
  }
  return { icon: <InsertDriveFile color="disabled" />, color: 'grey.400', label: 'File' };
};

const ResourceCard = ({ resource, onView, onDownload, onWatchVideo }) => {
  const { icon, color } = getFileTypeIcon(resource);
  return (
    <Card 
      elevation={2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          borderColor: color
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>{icon}</Avatar>
          <Typography variant="h6" component="h3" color="primary" noWrap>
            {resource.title}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {resource.description?.length > 80 ? resource.description.substring(0, 80) + '...' : resource.description}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {resource.categories && resource.categories.map(cat => (
            <Chip key={cat} label={cat} size="small" variant="outlined" color="primary" sx={{ fontWeight: 500, fontSize: 11 }} />
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {resource.createdAt ? format(new Date(resource.createdAt), 'MMM d, yyyy') : 'Unknown date'}
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
        <Box>
          {resource.fileUrl && (
            <Tooltip title="Download">
              <IconButton size="small" color="primary" onClick={() => onDownload(resource)}>
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {resource.videoLink && (
            <Tooltip title="Watch Video">
              <IconButton size="small" color="error" onClick={() => onWatchVideo(resource)}>
                <YouTube fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView(resource)}>
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default ResourceCard; 