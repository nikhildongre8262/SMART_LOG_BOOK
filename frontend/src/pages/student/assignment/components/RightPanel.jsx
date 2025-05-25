import React, { useState, useEffect } from 'react';
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
  Link
} from '@mui/material';
import {
  Download,
  Notifications,
  Assignment,
  NavigateNext
} from '@mui/icons-material';
import AssignmentCard from './AssignmentCard';
import axios from 'axios';
import { useAuth } from '../../../../contexts/AuthContext';
import mockSubmissionService from '../../../../services/mockSubmissionService';
import io from 'socket.io-client';

const RightPanel = ({
  selectedSubGroup,
  assignments,
  loading,
  submissionStats,
  onViewAssignment,
  onSubmitAssignment,
  onDownloadAll,
  notifications,
  mainGroups,
  subGroups,
  selectedMainGroup,
  onMainGroupClick
}) => {
  // Find the selected main group and subgroup names
  const selectedMainGroupData = mainGroups.find(g => g._id === selectedMainGroup);
  const selectedSubGroupData = selectedMainGroupData?.subGroups?.find(sg => sg._id === selectedSubGroup);

  // Add state for submissions
  const [submissions, setSubmissions] = useState({});
  const { token, user } = useAuth();

  // Fetch submissions for assignments
  const fetchSubmissions = async () => {
    try {
      const submissionsMap = {};
      for (const assignment of assignments) {
        try {
          const res = await axios.get(`/api/assignments/${assignment._id}/submissions/me`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { includeApproval: true }
          });
          
          console.log('Submission data for assignment', assignment._id, ':', res.data); // Debug log
          
          submissionsMap[assignment._id] = {
            status: res.data.status || 'not_submitted',
            approvalStatus: res.data.approvalStatus || 
                           (res.data.status === 'approved' ? 'approved' : 'pending'),
            updatedAt: res.data.updatedAt,
            approvedAt: res.data.approvedAt || 
                       (res.data.status === 'approved' ? res.data.updatedAt : null)
          };
        } catch (error) {
          console.error(`Failed to fetch submission for ${assignment._id}:`, error);
          submissionsMap[assignment._id] = {
            status: 'not_submitted',
            approvalStatus: 'pending'
          };
        }
      }
      setSubmissions(submissionsMap);
    } catch (error) {
      console.error('Submission fetch error:', error);
    }
  };

  useEffect(() => {
    if (assignments.length > 0) {
      fetchSubmissions();
    }
  }, [assignments, token]);

  useEffect(() => {
    const socket = io(process.env.REACT_APP_API_URL);
    
    // Socket.IO listener for submission approvals
    socket.on(`submissionApproved:${user._id}`, (data) => {
      console.log('Received submission approval:', data);
      setSubmissions(prev => ({
        ...prev,
        [data.assignmentId]: {
          status: data.status,
          approvalStatus: data.approvalStatus,
          approvedAt: data.approvedAt,
          updatedAt: new Date()
        }
      }));
    });

    socket.on('submissionApproved', (updatedSubmission) => {
      if (updatedSubmission.student === user._id) {
        setSubmissions(prev => ({
          ...prev,
          [updatedSubmission.assignment]: {
            status: 'approved',
            approvalStatus: 'approved',
            approvedAt: updatedSubmission.approvedAt,
            updatedAt: updatedSubmission.updatedAt
          }
        }));
      }
    });

    return () => {
      socket.off(`submissionApproved:${user._id}`);
      socket.disconnect();
    };
  }, [user._id]);

  if (!selectedSubGroup) {
    return (
      <Paper 
        elevation={2}
        sx={{ 
          height: 'calc(100vh - 100px)',
          minHeight: '640px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Assignment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="warning.text" gutterBottom>
          Select a Group
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Please select a group from the left panel to view assignments
        </Typography>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper 
        elevation={2}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          p: 3
        }}
      >
        <LinearProgress />
      </Paper>
    );
  }

  return (
    <Paper 
      elevation={2}
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Breadcrumb Navigation */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Breadcrumbs 
          separator={<NavigateNext fontSize="small" />}
          aria-label="group navigation"
        >
          <Link
            component="button"
            variant="body1"
            onClick={() => onMainGroupClick(selectedMainGroup)}
            sx={{ 
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {selectedMainGroupData?.name || 'Main Group'}
          </Link>
          <Typography color="warning.text">
            {selectedSubGroupData?.name || 'Subgroup'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="warning.text">
          Assignments
        </Typography>
        <Box>
          <Tooltip title="Download All">
            <IconButton onClick={onDownloadAll}>
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

      {submissionStats && (
        <Box sx={{ px: 2, mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="warning.text">
            Progress: {submissionStats.submitted} of {submissionStats.total} assignments submitted
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(submissionStats.submitted / submissionStats.total) * 100} 
            sx={{ height: 8 }}
          />
        </Box>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2}>
          {assignments.map((assignment) => (
            <Grid item xs={12} sm={6} md={4} key={assignment._id}>
              <AssignmentCard
                assignment={assignment}
                onView={() => onViewAssignment(assignment)}
                onSubmit={() => onSubmitAssignment(assignment)}
                submission={submissions[assignment._id]}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Paper>
  );
};

export default RightPanel; 