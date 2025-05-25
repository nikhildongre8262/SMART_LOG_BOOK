import React from 'react';
import { Paper, Box, Typography, Chip, Avatar, Button, Tooltip } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

const GroupCard = ({ group, selected, onSelect, onLeave, actionLoading }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        mb: 1,
        borderRadius: '4px',
        border: '1px solid',
        borderColor: selected ? '#333' : '#eee',
        bgcolor: selected ? '#f5f5f5' : '#ffffff',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        '&:hover': {
          bgcolor: '#fafafa',
          borderColor: '#999',
        },
      }}
      onClick={onSelect}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar 
          sx={{ 
            bgcolor: selected ? '#333' : '#f5f5f5',
            color: selected ? '#fff' : '#666',
            width: 40, 
            height: 40 
          }}
        >
          <GroupIcon />
        </Avatar>
        <Box flex={1}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: selected ? 500 : 400,
              color: '#333',
              mb: 0.5
            }}
          >
            {group.name}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#666',
              fontSize: '0.875rem'
            }}
          >
            {group.description || 'No description available'}
          </Typography>
          <Box mt={1}>
            <Chip
              label={group.status === 'active' ? 'Active' : 'Inactive'}
              size="small"
              sx={{
                bgcolor: group.status === 'active' ? '#e8f5e9' : '#f5f5f5',
                color: group.status === 'active' ? '#2e7d32' : '#666',
                fontWeight: 500,
                fontSize: '0.75rem',
                height: 20
              }}
            />
          </Box>
        </Box>
        <Tooltip title="Leave Group">
          <span>
            <Button
              variant="outlined"
              size="small"
              disabled={actionLoading}
              onClick={e => {
                e.stopPropagation();
                onLeave && onLeave(group._id, group.name);
              }}
              sx={{
                minWidth: 64,
                borderColor: '#e0e0e0',
                color: '#666',
                '&:hover': {
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  bgcolor: '#ffebee'
                }
              }}
            >
              Leave
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default GroupCard;
