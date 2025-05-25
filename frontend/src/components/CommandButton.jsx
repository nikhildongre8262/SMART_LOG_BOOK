import React from 'react';
import { Button, Box } from '@mui/material';

const CommandButton = ({ icon, label, onClick, sx, ...props }) => (
  <Button
    onClick={onClick}
    variant="contained"
    sx={{
      minWidth: 120,
      minHeight: 120,
      borderRadius: '30%',
      boxShadow: '0 6px 24px 0 rgba(0,0,0,0.18)',
      background: 'linear-gradient(135deg, #e0e7ff 60%, #c7d2fe 100%)',
      color: '#222',
      fontWeight: 700,
      fontSize: 18,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 0.12s',
      '&:active': {
        transform: 'scale(0.95)',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.22)',
      },
      ...sx,
    }}
    {...props}
  >
    <Box sx={{ fontSize: 40, mb: 1 }}>{icon}</Box>
    {label}
  </Button>
);

export default CommandButton;
