import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

const RecentActivityFeed = ({ activities = [] }) => (
  <Box mt={4}>
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      Recent Activity
    </Typography>
    <List dense sx={{ bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 2, boxShadow: 1 }}>
      {activities.length === 0 && (
        <ListItem><ListItemText primary="No recent activity yet." /></ListItem>
      )}
      {activities.map((act, idx) => (
        <ListItem key={idx}>
          <ListItemText primary={act.title} secondary={act.time} />
        </ListItem>
      ))}
    </List>
  </Box>
);

export default RecentActivityFeed;
