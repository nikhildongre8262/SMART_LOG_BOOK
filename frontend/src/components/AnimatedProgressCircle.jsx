import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const AnimatedProgressCircle = ({ value = 0, size = 80, label = '', color = 'primary' }) => (
  <Box position="relative" display="inline-flex">
    <CircularProgress
      variant="determinate"
      value={value}
      size={size}
      thickness={5}
      color={color}
      sx={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.12))' }}
    />
    <Box
      top={0}
      left={0}
      bottom={0}
      right={0}
      position="absolute"
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      width={size}
      height={size}
    >
      <Typography variant="h6" fontWeight={700}>{`${Math.round(value)}%`}</Typography>
      {label && <Typography variant="caption" color="text.secondary">{label}</Typography>}
    </Box>
  </Box>
);

export default AnimatedProgressCircle;
