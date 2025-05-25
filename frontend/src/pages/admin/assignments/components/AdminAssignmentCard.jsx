import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Divider,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Edit,
  Delete,
  Visibility,
  Assignment,
  People,
  Download,
  Schedule
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function AdminAssignmentCard({ 
  assignment, 
  onEdit, 
  onDelete, 
  onViewSubmissions,
  onDownloadAll
}) {
  const {
    title,
    description,
    deadline,
    createdAt,
    submissionStats = { total: 0, submitted: 0, graded: 0 }
  } = assignment;

  const isDeadlinePassed = new Date() > new Date(deadline);
  const submissionRate = submissionStats.total > 0 
    ? Math.round((submissionStats.submitted / submissionStats.total) * 100) 
    : 0;

  return (
    <Card elevation={3} sx={{ 
      height: '640px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '4px solid',
      borderLeftColor: isDeadlinePassed ? 'error.main' : 'primary.main'
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Typography variant="h6" fontWeight={600} color="primary">
            {title}
          </Typography>
          
          <Chip 
            label={isDeadlinePassed ? 'Closed' : 'Active'}
            size="small"
            color={isDeadlinePassed ? 'error' : 'success'}
            variant="outlined"
          />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {description || 'No description provided'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box mb={2}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
            <Schedule fontSize="small" color="action" />
            <Typography variant="caption">
              Due: {format(new Date(deadline), 'PPpp')}
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <Assignment fontSize="small" color="action" />
            <Typography variant="caption">
              Created: {format(new Date(createdAt), 'PP')}
            </Typography>
          </Stack>
        </Box>

        <Box mb={2}>
          <Typography variant="caption" display="block" gutterBottom>
            Submissions: {submissionStats.submitted}/{submissionStats.total} ({submissionRate}%)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={submissionRate} 
            color={submissionRate >= 80 ? 'success' : submissionRate >= 50 ? 'warning' : 'error'}
            sx={{ height: 8, borderRadius: 4 }}
          />
          
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Graded: {submissionStats.graded}/{submissionStats.submitted}
          </Typography>
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Submissions">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<People />}
              onClick={onViewSubmissions}
              fullWidth
            >
              Submissions
            </Button>
          </Tooltip>
          
          <Tooltip title="Download All">
            <Button 
              size="small" 
              variant="outlined" 
              startIcon={<Download />}
              onClick={onDownloadAll}
              fullWidth
            >
              Download
            </Button>
          </Tooltip>
        </Stack>
        
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button 
            size="small" 
            variant="contained" 
            startIcon={<Edit />}
            onClick={onEdit}
            fullWidth
          >
            Edit
          </Button>
          
          <Button 
            size="small" 
            variant="outlined" 
            color="error"
            startIcon={<Delete />}
            onClick={onDelete}
            fullWidth
          >
            Delete
          </Button>
        </Stack>
      </Box>
    </Card>
  );
}
