import React from 'react';
import { Card } from '@mui/material';

const GlassCard = ({ children, sx, ...props }) => (
  <Card
    elevation={8}
    sx={{
      backdropFilter: 'blur(12px)',
      background: 'rgba(255,255,255,0.25)',
      borderRadius: 4,
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
      border: '1px solid rgba(255,255,255,0.18)',
      ...sx,
    }}
    {...props}
  >
    {children}
  </Card>
);

export default GlassCard;
