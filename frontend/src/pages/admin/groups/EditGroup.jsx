import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, Edit } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext.js';
import { toast } from 'react-toastify';

const EditGroup = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/groups/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setName(res.data.name);
        setDescription(res.data.description);
        setStatus(res.data.status);
      } catch (err) {
        toast.error('Failed to load group');
      }
      setLoading(false);
    };
    fetchGroup();
    // eslint-disable-next-line
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/groups/${id}`, {
        name,
        description,
        password: password || undefined,
        status
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Group updated successfully');
      navigate('/admin/groups');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to update group');
    }
    setSubmitting(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Edit color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Edit Group
          </Typography>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={120}><CircularProgress /></Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextField
              label="Class Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Class Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              minRows={2}
            />
            <TextField
              label="Password (leave blank to keep unchanged)"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(s => !s)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              select
              fullWidth
              margin="normal"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </TextField>
            <Box mt={3} display="flex" justifyContent="center">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <Edit />}
              >
                {submitting ? 'Updating...' : 'Update Group'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default EditGroup;
