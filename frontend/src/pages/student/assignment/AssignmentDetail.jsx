import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Divider, 
  Chip, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  AccessTime, 
  AttachFile, 
  History, 
  Close,
  Download,
  Edit
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AssignmentDetail = () => {
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const { user } = useAuth();
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  // Calculate time left until deadline
  useEffect(() => {
    if (assignment?.deadline) {
      const calculateTimeLeft = () => {
        const now = new Date();
        const deadline = new Date(assignment.deadline);
        const difference = deadline - now;
        
        if (difference <= 0) {
          setTimeLeft('Deadline passed');
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        
        setTimeLeft(`${days}d ${hours}h ${minutes}m left`);
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 60000); // Update every minute
      return () => clearInterval(timer);
    }
  }, [assignment]);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!assignmentId) {
        toast.error('Invalid assignment.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(
          `/api/student/assignments/${assignmentId}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setAssignment(response.data);
        
        // Check submission status
        const submissionRes = await axios.get(
          `/api/student/assignments/${assignmentId}/submission`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setSubmissionStatus(submissionRes.data);

        // If submission was rejected, show notification
        if (submissionRes.data?.status === 'rejected') {
          setNotificationMessage('Your submission was rejected. Please resubmit with the required changes.');
          setShowNotification(true);
        }
      } catch (error) {
        console.error('Error fetching assignment:', error);
        toast.error('Failed to fetch assignment details');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, user.token]);

  // Add notification effect
  useEffect(() => {
    if (assignment) {
      const isNewAssignment = new Date(assignment.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Within last 24 hours
      if (isNewAssignment) {
        setNotificationMessage('New assignment posted!');
        setShowNotification(true);
      }
    }
  }, [assignment]);

  const handleFileChange = (event) => {
    setFiles([...event.target.files]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionText', submissionText);
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      const response = await axios.post(
        `/api/student/assignments/${assignmentId}/submit`, 
        formData, 
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${user.token}` 
          }
        }
      );

      // Update submission status immediately
      setSubmissionStatus(response.data);
      setShowSubmitDialog(false);
      setSubmissionText('');
      setFiles([]);
      toast.success('Assignment submitted successfully!');
      
      // Refresh submission history
      const historyRes = await axios.get(
        `/api/student/assignments/${assignmentId}/submission-history`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSubmissionHistory(historyRes.data);

      // Force a re-render by updating the assignment
      const updatedAssignment = await axios.get(
        `/api/student/assignments/${assignmentId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setAssignment(updatedAssignment.data);
    } catch (error) {
      toast.error('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewHistory = async () => {
    try {
      const response = await axios.get(
        `/api/student/assignments/${assignmentId}/submission-history`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setSubmissionHistory(response.data);
      setShowHistoryDialog(true);
    } catch (error) {
      toast.error('Failed to fetch submission history');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6">Assignment Not Found</Typography>
      </Box>
    );
  }

  const isDeadlinePassed = new Date() > new Date(assignment.deadline);
  const canSubmit = !isDeadlinePassed || assignment.allowLateSubmission;

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Snackbar
        open={showNotification}
        autoHideDuration={6000}
        onClose={() => setShowNotification(false)}
        message={notificationMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={() => setShowNotification(false)}
          >
            <Close fontSize="small" />
          </IconButton>
        }
      />

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            {assignment.title}
          </Typography>
          <Box>
            <Tooltip title="View Submission History">
              <IconButton onClick={handleViewHistory}>
                <History />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <AccessTime sx={{ mr: 1 }} />
              <Typography variant="subtitle1" color={isDeadlinePassed ? 'error' : 'text.secondary'}>
                {timeLeft}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Chip 
              label={submissionStatus ? 'Submitted' : 'Not Submitted'} 
              color={submissionStatus ? 'success' : 'warning'}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1" paragraph>
          {assignment.description}
        </Typography>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {!submissionStatus ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setShowSubmitDialog(true)}
              disabled={!canSubmit}
              startIcon={<AttachFile />}
            >
              Submit Assignment
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => setShowSubmitDialog(true)}
                disabled={!canSubmit || (submissionStatus?.status === 'graded' && !assignment.allowResubmission)}
                startIcon={<Edit />}
              >
                {submissionStatus?.status === 'rejected' ? 'Resubmit Assignment' : 'Resubmit Assignment'}
              </Button>
              
              <Button 
                variant="outlined" 
                color="secondary"
                onClick={() => navigate(`/student/assignments/${assignmentId}/submission/${submissionStatus._id}`)}
              >
                View Submission
              </Button>
            </Box>
          )}
        </Box>

        {submissionStatus?.status === 'rejected' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Your submission was rejected. Please review the feedback and resubmit.
          </Alert>
        )}

        {/* Add submission status indicator */}
        {submissionStatus && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`Status: ${submissionStatus.status.charAt(0).toUpperCase() + submissionStatus.status.slice(1)}`}
              color={
                submissionStatus.status === 'submitted' ? 'info' :
                submissionStatus.status === 'graded' ? 'success' :
                submissionStatus.status === 'rejected' ? 'error' : 'default'
              }
            />
          </Box>
        )}
      </Paper>

      {/* Submit Dialog */}
      <Dialog 
        open={showSubmitDialog} 
        onClose={() => setShowSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Submit Assignment
          <IconButton
            aria-label="close"
            onClick={() => setShowSubmitDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isDeadlinePassed && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              The deadline has passed. Late submission may affect your grade.
            </Alert>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            label="Submission Notes"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button variant="outlined" component="label">
            Upload Files
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileChange}
            />
          </Button>
          {files.length > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              {files.length} file(s) selected
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={showHistoryDialog} 
        onClose={() => setShowHistoryDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission History
          <IconButton
            aria-label="close"
            onClick={() => setShowHistoryDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {submissionHistory.map((submission, index) => (
            <Paper key={submission._id} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1">
                Submission #{submissionHistory.length - index}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Submitted on: {new Date(submission.submittedAt).toLocaleString()}
              </Typography>
              {submission.comment && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {submission.comment}
                </Typography>
              )}
              {submission.files && submission.files.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {submission.files.map((file, fileIndex) => (
                    <Button 
                      key={fileIndex}
                      size="small"
                      startIcon={<Download />}
                      onClick={() => window.open(file.url, '_blank')}
                    >
                      {file.name}
                    </Button>
                  ))}
                </Box>
              )}
            </Paper>
          ))}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AssignmentDetail;
