import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Alert,
  LinearProgress
} from '@mui/material';
import { Close, AttachFile } from '@mui/icons-material';

const AssignmentSubmitModal = ({ open, onClose, assignment, onSubmit }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setFiles([...event.target.files]);
  };

  const handleSubmit = async () => {
    if (!submissionText.trim()) {
      setError('Please provide submission notes');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('submissionText', submissionText);
      files.forEach((file) => {
        formData.append('files', file);
      });

      await onSubmit(formData);
      setSubmissionText('');
      setFiles([]);
    } catch (error) {
      setError('Failed to submit assignment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDeadlinePassed = new Date() > new Date(assignment.deadline);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Submit Assignment
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {isDeadlinePassed && !assignment.allowLateSubmission && (
          <Alert severity="error" sx={{ mb: 2 }}>
            The deadline has passed and late submissions are not allowed.
          </Alert>
        )}

        {isDeadlinePassed && assignment.allowLateSubmission && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The deadline has passed. Late submission may affect your grade.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {assignment.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {assignment.description}
          </Typography>
        </Box>

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

        <Button
          variant="outlined"
          color="primary"
          component="label"
          startIcon={<AttachFile />}
          sx={{ mb: 1 }}
        >
          Upload Files
          <input
            type="file"
            hidden
            multiple
            onChange={handleFileChange}
          />
        </Button>

        {files.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            {files.length} file(s) selected
          </Typography>
        )}

        {submitting && (
          <LinearProgress sx={{ mt: 2 }} />
        )}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose} 
          color="primary"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={submitting || (isDeadlinePassed && !assignment.allowLateSubmission)}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentSubmitModal; 