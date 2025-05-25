import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Search, Refresh } from '@mui/icons-material';
import StudentAssignmentCard from './components/StudentAssignmentCard';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { token } = useAuth();

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/student/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const filteredAssignments = assignments.filter(assignment => 
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    assignment.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewAssignment = (assignmentId) => {
    // Navigate to assignment details
    console.log('View assignment:', assignmentId);
  };

  const handleSubmitAssignment = (assignmentId) => {
    // Open submission dialog
    console.log('Submit assignment:', assignmentId);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={600}>
          My Assignments
        </Typography>
        
        <TextField
          size="small"
          placeholder="Search assignments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredAssignments.map((assignment) => (
            <Grid item xs={12} sm={6} md={4} key={assignment._id}>
              <StudentAssignmentCard
                assignment={assignment}
                onView={() => handleViewAssignment(assignment._id)}
                onSubmit={() => handleSubmitAssignment(assignment._id)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
