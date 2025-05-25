import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AssignmentForm = ({ open, onClose, onSubmit, initialValues, mainGroupName, subGroupName }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [deadline, setDeadline] = useState(initialValues?.deadline ? new Date(initialValues.deadline) : null);
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState(initialValues?.files || []);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    setUploading(true);
    setError('');
    let uploadedUrls = [];
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await axios.post('/api/assignments/upload-file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        uploadedUrls.push(res.data.url);
      } catch (err) {
        setError('File upload failed');
      }
    }
    setFileUrls(prev => [...prev, ...uploadedUrls]);
    setFiles(prev => [...prev, ...selectedFiles]);
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[DEBUG] Save button clicked'); 
    setError('');
    setLoading(true);
    
    // Validate required fields
    if (!title.trim()) {
      console.log('[DEBUG] Validation failed: Title missing');
      setError('Title is required');
      setLoading(false);
      return;
    }
    if (!description.trim()) {
      console.log('[DEBUG] Validation failed: Description missing');
      setError('Description is required');
      setLoading(false);
      return;
    }
    if (!deadline) {
      console.log('[DEBUG] Validation failed: Deadline missing');
      setError('Deadline is required');
      setLoading(false);
      return;
    }

    try {
      console.log('[DEBUG] Calling onSubmit with:', { 
        title, 
        description, 
        deadline, 
        files: files.length 
      });
      
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        deadline: deadline.toISOString(),
        files
      });
      
      console.log('[DEBUG] Form submitted successfully');
      
      // Only reset form if parent onSubmit succeeds
      setTitle('');
      setDescription('');
      setDeadline(null);
      setFiles([]);
      setFileUrls([]);
      setError('');
      
      onClose();
    } catch (err) {
      console.error('[DEBUG] Submission error:', err);
      setError(err.response?.data?.message || 'Failed to save assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
      <DialogContent>
        {mainGroupName && subGroupName && (
          <Typography variant="subtitle2" color="primary" sx={{ mb: 2 }}>
            {mainGroupName} / {subGroupName}
          </Typography>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }} id="assignment-form">
          <TextField
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            margin="normal"
          />
          <DateTimePicker
            label="Deadline"
            value={deadline}
            onChange={setDeadline}
            renderInput={(params) => <TextField {...params} fullWidth margin="normal" required />}
          />
          <Button component="label" variant="outlined" sx={{ mt: 2 }} disabled={uploading}>
            Upload File(s)
            <input type="file" hidden multiple onChange={handleFileChange} />
          </Button>
          {uploading && <LinearProgress sx={{ mt: 1 }} />}
          {files.length > 0 && (
            <Box sx={{ ml: 2, mt: 1 }}>
              {files.map((file, idx) => (
                <Typography key={idx} sx={{ color: fileUrls[idx] ? 'green' : 'inherit' }}>
                  {file.name} {fileUrls[idx] && (<a href={fileUrls[idx]} target="_blank" rel="noopener noreferrer">[View]</a>)}
                </Typography>
              ))}
            </Box>
          )}
          {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading || uploading}>Cancel</Button>
        <Button 
          type="submit" 
          form="assignment-form" 
          variant="contained" 
          disabled={loading || uploading}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentForm;
