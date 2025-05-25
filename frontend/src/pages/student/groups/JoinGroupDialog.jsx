import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography, IconButton, InputAdornment
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const JoinGroupDialog = ({ open, onClose, onJoin, loading, error }) => {
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleJoin = () => {
    onJoin(joinCode, joinPassword);
  };

  const handleClose = () => {
    setJoinCode('');
    setJoinPassword('');
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Join Main Group</DialogTitle>
      <DialogContent>
        <TextField
          label="Group ID"
          value={joinCode}
          onChange={e => setJoinCode(e.target.value)}
          fullWidth
          margin="dense"
          autoFocus
          disabled={loading}
        />
        <TextField
          label="Group Password"
          value={joinPassword}
          onChange={e => setJoinPassword(e.target.value)}
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="dense"
          disabled={loading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  size="small"
                  tabIndex={-1}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        {error && <Typography color="error" variant="body2" mt={1}>{error}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleJoin} variant="contained" color="primary" disabled={loading || !joinCode || !joinPassword}>
          Join
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JoinGroupDialog;
