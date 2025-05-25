import React from 'react';
import { Typography, Container, Box, Paper, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Forbidden = () => {
  const navigate = useNavigate();
  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 3, textAlign: 'center' }}>
        <Box display="flex" flexDirection="column" alignItems="center">
          <ErrorOutline sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Forbidden
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            You do not have permission to access this page.
          </Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/')}>Go Home</Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Forbidden;
