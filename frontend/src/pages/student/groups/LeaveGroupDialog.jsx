import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Button } from '@mui/material';

const LeaveGroupDialog = ({ open, groupName, onClose, onLeave, loading }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Leave Group</DialogTitle>
    <DialogContent>
      <Typography>Are you sure you want to leave <b>{groupName}</b>?</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button onClick={onLeave} color="error" variant="contained" disabled={loading}>Leave</Button>
    </DialogActions>
  </Dialog>
);

export default LeaveGroupDialog;
