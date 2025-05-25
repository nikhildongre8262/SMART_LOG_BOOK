import React, { useEffect, useState } from 'react';
import {
  Container, Paper, Typography, Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, MenuItem
} from '@mui/material';
import { Edit, Delete, Add, ArrowBack, GroupWork, Archive } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext.js';
import { toast } from 'react-toastify';

const statusColors = { active: 'success', inactive: 'warning', archived: 'default' };

const GroupDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openSubGroup, setOpenSubGroup] = useState(false);
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editSubOpen, setEditSubOpen] = useState(false);
  const [editSub, setEditSub] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubStatus, setEditSubStatus] = useState('active');

  const fetchGroup = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/groups/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setGroup(res.data);
    } catch (err) {
      toast.error('Failed to load group');
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroup(); /* eslint-disable-next-line */ }, [id]);

  const handleAddSubGroup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`/api/groups/${id}/subgroup`, { name: subName, description: subDesc }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Sub-Group Created Successfully!');
      setOpenSubGroup(false);
      setSubName(''); setSubDesc('');
      fetchGroup();
    } catch (err) {
      toast.error('Failed to add sub-group');
    }
    setSubmitting(false);
  };

  const handleDeleteSubGroup = async (subId) => {
    if (!window.confirm('Delete this sub-group?')) return;
    try {
      await axios.delete(`/api/groups/${id}/subgroup/${subId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Sub-Group deleted');
      fetchGroup();
    } catch (err) {
      toast.error('Failed to delete sub-group');
    }
  };

  // Edit sub-group handlers
  const openEditSubGroup = (sub) => {
    setEditSub(sub);
    setEditSubName(sub.name);
    setEditSubDesc(sub.description);
    setEditSubStatus(sub.status);
    setEditSubOpen(true);
  };
  const handleEditSubGroup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.put(`/api/groups/${id}/subgroup/${editSub._id}`, {
        name: editSubName,
        description: editSubDesc,
        status: editSubStatus
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Sub-Group updated');
      setEditSubOpen(false);
      fetchGroup();
    } catch (err) {
      toast.error('Failed to update sub-group');
    }
    setSubmitting(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/groups')}>Back to Groups</Button>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}><CircularProgress /></Box>
      ) : group ? (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <Tooltip title="Back to Groups">
              <IconButton onClick={() => navigate('/admin/groups')}><ArrowBack /></IconButton>
            </Tooltip>
            <Typography variant="h5" fontWeight={700} ml={2}>Manage Sub-Groups for: {group?.name}</Typography>
            <Chip label={group?.status} color={statusColors[group?.status] || 'default'} size="small" sx={{ ml: 2 }} />
          </Box>
          <Typography variant="subtitle1" color="text.secondary" mb={2}>{group.description}</Typography>
          <Typography variant="body2" mb={1}><b>Class Code:</b> {group.mainGroupCode}</Typography>
          <Typography variant="body2" mb={2}><b>Created:</b> {new Date(group.createdAt).toLocaleDateString()} | <b>Last Activity:</b> {new Date(group.lastActivityAt).toLocaleDateString()}</Typography>
          <Box mb={2}>
            <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => setOpenSubGroup(true)}>Add Sub-Group</Button>
          </Box>
          <Typography variant="h6" fontWeight={600} mb={1}><GroupWork sx={{ mr: 1 }} />Sub-Groups</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.subGroups?.map(sub => (
                  <TableRow key={sub._id}>
                    <TableCell>{sub.name}</TableCell>
                    <TableCell>{sub.description}</TableCell>
                    <TableCell><Chip label={sub.status} color={statusColors[sub.status] || 'default'} size="small" /></TableCell>
                    <TableCell>{new Date(sub.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton color="secondary" onClick={() => openEditSubGroup(sub)}><Edit /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteSubGroup(sub._id)}><Delete /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {(!group.subGroups || group.subGroups.length === 0) && (
                  <TableRow><TableCell colSpan={5} align="center">No sub-groups.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Typography color="error">Group not found.</Typography>
      )}
      <Dialog open={openSubGroup} onClose={() => setOpenSubGroup(false)}>
        <DialogTitle>Add Sub-Group</DialogTitle>
        <form onSubmit={handleAddSubGroup}>
          <DialogContent>
            <TextField label="Sub-Group Name" value={subName} onChange={e => setSubName(e.target.value)} required fullWidth margin="normal" />
            <TextField label="Sub-Group Description" value={subDesc} onChange={e => setSubDesc(e.target.value)} fullWidth margin="normal" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenSubGroup(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>{submitting ? <CircularProgress size={18} /> : 'Add'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Edit Sub-Group Modal */}
      <Dialog open={editSubOpen} onClose={() => setEditSubOpen(false)}>
        <DialogTitle>Edit Sub-Group</DialogTitle>
        <form onSubmit={handleEditSubGroup}>
          <DialogContent>
            <TextField label="Sub-Group Name" value={editSubName} onChange={e => setEditSubName(e.target.value)} required fullWidth margin="normal" />
            <TextField label="Sub-Group Description" value={editSubDesc} onChange={e => setEditSubDesc(e.target.value)} fullWidth margin="normal" />
            <TextField label="Status" value={editSubStatus} onChange={e => setEditSubStatus(e.target.value)} select fullWidth margin="normal">
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditSubOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={submitting}>{submitting ? <CircularProgress size={18} /> : 'Update'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default GroupDetail;
