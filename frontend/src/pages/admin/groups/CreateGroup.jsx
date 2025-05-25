import React, { useState } from 'react';
import {
  Container, Paper, Typography, Box, TextField, Button, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff, Lock, GroupAdd } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext.js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const CreateGroup = () => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/groups/create', {
        name,
        description,
        password,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Class Created Successfully!');
      navigate('/admin/groups');
    } catch (err) {
      toast.error(err.response?.data?.errors?.[0]?.msg || 'Failed to create group');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <GroupAdd color="primary" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Create Main Group (Class)
          </Typography>
        </Box>
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
            label="Password (for students to join)"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
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
          <Box mt={3} display="flex" justifyContent="center">
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <GroupAdd />}
            >
              {loading ? 'Creating...' : 'Create Class'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateGroup;
