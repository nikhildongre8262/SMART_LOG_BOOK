import React, { useEffect, useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { notifySuccess, notifyError, notifyInfo } from '../utils/notify';
import axios from 'axios';
import mockSubmissionService from '../services/mockSubmissionService';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Download as DownloadIcon, Grade as GradeIcon, Check as CheckIcon, Close as RejectIcon } from '@mui/icons-material';

const SubmissionList = ({ assignment, open, onClose, addNotification }) => {
  const { token } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [bulkGrade, setBulkGrade] = useState('');
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [bulkGrading, setBulkGrading] = useState(false);

  useEffect(() => {
    if (open && assignment) {
      setLoading(true);
      axios.get(`/api/assignments/${assignment._id}/submissions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setSubmissions(res.data))
        .catch(() => setSubmissions([]))
        .finally(() => setLoading(false));
    }
  }, [open, assignment, token]);

  const handleGrade = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || '');
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleApprove = (submission) => {
    setSelectedSubmission(submission);
    setGrade(submission.grade || '');
    setFeedback(submission.feedback || '');
    setGradingDialogOpen(true);
  };

  const handleGradeSubmit = async () => {
    if (!grade || isNaN(grade) || grade < 0 || grade > 100) {
      notifyError('Please enter a valid grade between 0 and 100');
      return;
    }

    setGrading(true);
    try {
      // First submit the grade
      const response = await axios.patch(
        `/api/assignments/${assignment._id}/submissions/${selectedSubmission.student._id}`,
        { 
          grade: Number(grade), 
          feedback,
          status: 'approved'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub._id === selectedSubmission._id ? response.data : sub
      ));
      
      notifySuccess('Submission graded and approved');
      addNotification(`Your submission for ${assignment.title} has been graded and approved`);
      setGradingDialogOpen(false);
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const handleReject = async (submissionId) => {
    try {
      const response = await mockSubmissionService.updateStatus(submissionId, 'rejected');
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub._id === submissionId ? { ...sub, status: 'rejected' } : sub
      ));
      
      notifySuccess('Submission rejected');
      addNotification(`Your submission for ${assignment.title} was rejected. Please resubmit.`);
    } catch (error) {
      notifyError(error.response?.data?.message || 'Failed to reject submission');
    }
  };

  const handleDownload = async (submission) => {
    try {
      const response = await axios.get(
        `/api/assignments/${assignment._id}/submissions/${submission.student._id}/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Get the content type from the response
      const contentType = response.headers['content-type'];
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${submission.student.name}_submission`;
      
      // Determine file extension based on content type
      if (contentType === 'application/pdf') {
        filename += '.pdf';
      } else if (contentType === 'application/zip') {
        filename += '.zip';
      } else if (contentDisposition) {
        // Try to get filename from content-disposition header
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      notifySuccess('Submission downloaded successfully');
    } catch (error) {
      console.error('Error downloading submission:', error);
      notifyError('Failed to download submission');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Submissions for: {assignment.title}</DialogTitle>
      <DialogContent>
        <Box mb={2} display="flex" gap={2}>
          <Button variant="contained" color="warning" onClick={async () => {
            if(window.confirm('Close this assignment? No further submissions will be accepted.')) {
              await axios.patch(`/api/assignments/${assignment._id}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
              notifySuccess('Assignment closed. No further submissions allowed.');
              if (addNotification) addNotification('Assignment closed. No further submissions allowed.');
              // Optionally refresh assignment status
            }
          }}>Close Assignment</Button>
          <Button variant="contained" color="info" onClick={async () => {
            await axios.post(`/api/assignments/${assignment._id}/reminder`, {}, { headers: { Authorization: `Bearer ${token}` } });
            notifySuccess('Reminders sent to students who have not submitted.');
            if (addNotification) addNotification('Reminders sent to students who have not submitted.');
          }}>Send Reminder</Button>
        </Box>
        {loading ? <Box display="flex" justifyContent="center"><CircularProgress /></Box> : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <FormControlLabel
                      control={<Checkbox checked={selectedRows.length === submissions.length && submissions.length > 0} onChange={e => setSelectedRows(e.target.checked ? submissions.map(s => s.student._id) : [])} />}
                      label="Select All"
                    />
                  </TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Submitted On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell>Late?</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Feedback</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.length === 0 && (
                  <TableRow><TableCell colSpan={8}>No submissions yet.</TableCell></TableRow>
                )}
                {submissions.map((sub, idx) => (
                  <TableRow key={idx}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedRows.includes(sub.student._id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedRows(prev => [...prev, sub.student._id]);
                          else setSelectedRows(prev => prev.filter(id => id !== sub.student._id));
                        }}
                        disabled={sub.status === 'not_submitted'}
                      />
                    </TableCell>
                    <TableCell>{sub.student?.name || 'Unknown'}</TableCell>
                    <TableCell>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{sub.status === 'submitted' ? 'Submitted' : sub.status === 'graded' ? 'Graded' : 'Not Submitted'}</TableCell>
                    <TableCell>{sub.file ? <a href={sub.file} target="_blank" rel="noopener noreferrer">File</a> : '-'}</TableCell>
                    <TableCell>{sub.late ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{sub.grade || '-'}</TableCell>
                    <TableCell>{sub.feedback || '-'}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Download Submission">
                          <IconButton size="small" color="primary" onClick={() => handleDownload(sub)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {sub.status !== 'approved' && sub.status !== 'graded' && (
                          <>
                            <Tooltip title="Approve and Grade">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(sub)}
                                disabled={sub.status === 'not_submitted'}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(sub._id)}
                                disabled={sub.status === 'not_submitted'}
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        
                        {sub.status === 'graded' && (
                          <Tooltip title="View Grade">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => {
                                setSelectedSubmission(sub);
                                setGrade(sub.grade);
                                setFeedback(sub.feedback);
                                setGradingDialogOpen(true);
                              }}
                            >
                              <GradeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Bulk Grading Row */}
                {selectedRows.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Typography>Bulk Grade/Feedback for selected:</Typography>
                        <TextField size="small" label="Grade" value={bulkGrade} onChange={e => setBulkGrade(e.target.value)} sx={{ width: 100 }} />
                        <TextField size="small" label="Feedback" value={bulkFeedback} onChange={e => setBulkFeedback(e.target.value)} sx={{ width: 200 }} />
                        <Button variant="contained" size="small" disabled={bulkGrading} onClick={async () => {
                          setBulkGrading(true);
                          await Promise.all(selectedRows.map(studentId => axios.patch(`/api/assignments/${assignment._id}/submissions/${studentId}`, { grade: bulkGrade, feedback: bulkFeedback }, { headers: { Authorization: `Bearer ${token}` } })));
                          // Refresh submissions
                          const res = await axios.get(`/api/assignments/${assignment._id}/submissions`, { headers: { Authorization: `Bearer ${token}` } });
                          setSubmissions(res.data);
                          setSelectedRows([]);
                          setBulkGrade('');
                          setBulkFeedback('');
                          setBulkGrading(false);
                          notifySuccess('Bulk grade/feedback applied.');
                          if (addNotification) addNotification('Bulk grade/feedback applied.');
                        }}>Apply to All</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* Grading Modal */}
        <Dialog open={gradingDialogOpen} onClose={() => setGradingDialogOpen(false)}>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogContent>
            <TextField
              label="Grade"
              value={grade}
              onChange={e => setGrade(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Feedback"
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGradingDialogOpen(false)} disabled={grading}>Cancel</Button>
            <Button onClick={handleGradeSubmit} variant="contained" disabled={grading}>Submit</Button>
          </DialogActions>
        </Dialog>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmissionList;
