import React, { useEffect, useState } from 'react';
import {
  Box, Paper, List, ListItemButton, ListItemIcon, ListItemText,
  Divider, TextField, InputAdornment, CircularProgress, Collapse,
  Typography, Grid, Chip, Avatar, Badge
} from '@mui/material';
import {
  ExpandLess, ExpandMore, Search, Group, Folder, CheckCircle, Pending
} from '@mui/icons-material';

const LeftPanel = ({ 
  mainGroups, 
  subGroups, 
  selectedMainGroup, 
  selectedSubGroup,
  onMainGroupClick,
  onSubGroupClick,
  searchTerm,
  onSearchChange,
  loading
}) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  
  useEffect(() => {
    const initialExpanded = {};
    mainGroups.forEach(group => {
      initialExpanded[group._id] = expandedGroups[group._id] || false;
    });
    setExpandedGroups(initialExpanded);
  }, [mainGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const filteredMainGroups = mainGroups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Paper 
      elevation={0}
      sx={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderRight: 'none',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ 
        p: 2, 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search groups..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'background.default'
            }
          }}
        />
      </Box>

      <Box sx={{ 
        flexGrow: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List disablePadding>
            {filteredMainGroups.map((group) => (
              <React.Fragment key={group._id}>
                <ListItemButton
                  selected={selectedMainGroup?._id === group._id}
                  onClick={() => {
                    toggleGroup(group._id);
                    onMainGroupClick(group._id);
                  }}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'action.selected',
                      '&:hover': {
                        backgroundColor: 'action.selected'
                      }
                    }
                  }}
                >
                  <ListItemIcon>
                    <Group fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={group.name} 
                    primaryTypographyProps={{ variant: 'body1' }}
                  />
                  {expandedGroups[group._id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                <Collapse in={expandedGroups[group._id]} timeout="auto" unmountOnExit>
                  <Box sx={{ pl: 4, pr: 2, pt: 1, pb: 1 }}>
                    <Grid container spacing={1}>
                      {subGroups[group._id]?.map((subGroup) => (
                        <Grid item xs={6} key={subGroup._id}>
                          <ListItemButton
                            selected={selectedSubGroup?._id === subGroup._id}
                            onClick={() => onSubGroupClick(subGroup)}
                            sx={{
                              p: 1,
                              borderRadius: 1,
                              '&.Mui-selected': {
                                backgroundColor: 'warning.light',
                                color: 'warning.contrastText',
                                '&:hover': {
                                  backgroundColor: 'warning.light'
                                }
                              }
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: '36px' }}>
                              <Folder fontSize="small" />
                            </ListItemIcon>
                            <ListItemText 
                              primary={subGroup.name} 
                              primaryTypographyProps={{ variant: 'body2' }}
                            />
                          </ListItemButton>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
};

export default LeftPanel;