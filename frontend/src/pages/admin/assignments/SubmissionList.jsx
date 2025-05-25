import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Download as DownloadIcon,
  Grade as GradeIcon,
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  Check as CheckIcon,
  Close as RejectIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';

const SubmissionList = ({ assignment, open, onClose }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingDialog, setShowGradingDialog] = useState(false);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [gradingLoading, setGradingLoading] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedSubmissionForMenu, setSelectedSubmissionForMenu] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (open && assignment) {
      // Force update late submissions first
      forceUpdateLateSubmissions();
      // Then fetch submissions
      fetchSubmissions();
    }
  }, [open, assignment]);

  const forceUpdateLateSubmissions = async () => {
    try {
      const response = await axios.post('/api/assignments/force-update-late-submissions', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Force update response:', response.data);
    } catch (error) {
      console.error('Error force updating late submissions:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/assignments/${assignment._id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmissions(response.data);
    } catch (err) {
      setError('Failed to fetch submissions');
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async () => {
    if (!grade || isNaN(grade) || grade < 0 || grade > 100) {
      toast.error('Please enter a valid grade between 0 and 100');
      return;
    }

    try {
      setGradingLoading(true);
      const response = await axios.patch(
        `/api/assignments/${assignment._id}/submissions/${selectedSubmission.student._id}`,
        { grade: Number(grade), feedback },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubmissions(submissions.map(sub => 
        sub._id === response.data._id ? response.data : sub
      ));
      
      setShowGradingDialog(false);
      setSelectedSubmission(null);
      setGrade('');
      setFeedback('');
      toast.success('Submission graded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGradingLoading(false);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await axios.get(`/api/assignments/download/${file._id}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalname);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download file');
    }
  };

  const handleExportSubmission = async (submission) => {
    try {
      const response = await axios.get(
        `/api/assignments/${assignment._id}/submissions/${submission.student._id}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${submission.student.name}_submission.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to export submission');
    }
  };

  const handleRejectSubmission = async (submission) => {
    try {
      const response = await axios.patch(
        `/api/assignments/${assignment._id}/submissions/${submission.student._id}`,
        { 
          grade: 0,
          feedback: 'Submission rejected',
          status: 'rejected'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubmissions(submissions.map(sub => 
        sub._id === response.data._id ? response.data : sub
      ));
      
      toast.success('Submission rejected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject submission');
    }
  };

  const handleMenuOpen = (event, submission) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedSubmissionForMenu(submission);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedSubmissionForMenu(null);
  };

  const getStatusChip = (submission) => {
    if (submission.status === 'graded') {
      return <Chip label="Graded" color="success" size="small" />;
    }
    if (submission.isLate) {
      return <Chip label="Late" color="error" size="small" />;
    }
    return <Chip label="Submitted" color="primary" size="small" />;
  };

  if (!assignment) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
          minHeight: '80vh',
          width: '90vw'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Submissions for {assignment?.title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : submissions.length === 0 ? (
          <Box textAlign="center" p={3}>
            <Typography color="text.secondary">
              No submissions yet
            </Typography>
          </Box>
        ) : (
          <List>
            {submissions.map((submission) => (
              <ListItem
                key={submission._id}
                sx={{
                  mb: 2,
                  border: '1px solid',
                  borderColor: submission.isLate ? 'error.main' : 'divider',
                  borderRadius: '4px',
                  bgcolor: submission.isLate ? 'error.lighter' : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  p: 2
                }}
              >
                <Box display="flex" width="100%" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography 
                      variant="subtitle1"
                      color={submission.isLate ? 'error' : 'textPrimary'}
                    >
                      {submission.student.name}
                    </Typography>
                    {getStatusChip(submission)}
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => handleExportSubmission(submission)}
                    >
                      Export
                    </Button>
                    {submission.status !== 'graded' && submission.status !== 'rejected' && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CheckIcon />}
                          color="success"
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setShowGradingDialog(true);
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RejectIcon />}
                          color="error"
                          onClick={() => handleRejectSubmission(submission)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
                <Box width="100%">
                  <Typography 
                    variant="body2" 
                    color={submission.isLate ? 'error' : 'text.secondary'}
                  >
                    Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    {submission.isLate && ' (Late Submission)'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    {submission.submissionText}
                  </Typography>
                  {submission.grade && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Grade: {submission.grade}
                    </Typography>
                  )}
                  {submission.feedback && (
                    <Typography variant="body2" color="text.secondary" mt={1}>
                      Feedback: {submission.feedback}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>

      {/* Grading Dialog */}
      <Dialog
        open={showGradingDialog}
        onClose={() => setShowGradingDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <TextField
              fullWidth
              label="Grade (0-100)"
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Feedback"
              multiline
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowGradingDialog(false)}
            disabled={gradingLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGradeSubmission}
            variant="contained"
            disabled={gradingLoading}
          >
            {gradingLoading ? 'Submitting...' : 'Submit Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default SubmissionList; 