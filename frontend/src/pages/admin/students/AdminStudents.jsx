import React, { useEffect, useState, useCallback } from 'react';
import {
  Container, Typography, Paper, Box, Button, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, Tooltip, CircularProgress, TextField, 
  InputAdornment, MenuItem, Select, Checkbox, Toolbar
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Person, Search, Refresh } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const statusColors = {
  active: 'success',
  inactive: 'warning',
  suspended: 'error',
};

const AdminStudents = () => {
  const { user, token } = useAuth();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/students', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status, sort },
      });
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to load students');
    }
    setLoading(false);
  }, [token, search, status, sort]);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line
  }, [search, status, sort, fetchStudents]);

  const handleDelete = async (id) => {
    const confirmDelete = window.prompt('Type DELETE to confirm student deletion:');
    if (confirmDelete !== 'DELETE') return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/students/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
    setDeletingId(null);
  };

  const handleSuspend = async (id) => {
    if (!window.confirm('Suspend this student?')) return;
    setSuspendingId(id);
    try {
      await axios.patch(`/api/students/${id}/status`, { status: 'suspended' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Student suspended');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to suspend student');
    }
    setSuspendingId(null);
  };

  // Bulk selection logic
  const isSelected = (id) => selected.indexOf(id) !== -1;
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(students.map((s) => s._id));
    } else {
      setSelected([]);
    }
  };
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    const confirmDelete = window.prompt('Type DELETE to confirm bulk student deletion:');
    if (confirmDelete !== 'DELETE') return;
    for (let id of selected) {
      await handleDelete(id);
    }
    setSelected([]);
  };
  
  const handleBulkSuspend = async () => {
    if (selected.length === 0) return;
    if (!window.confirm('Suspend selected students?')) return;
    for (let id of selected) {
      await handleSuspend(id);
    }
    setSelected([]);
  };
  
  const handleExport = (type = 'csv') => {
    const exportStudents = students.filter((s) => selected.includes(s._id));
    if (type === 'csv') {
      const csv = [
        ['Name', 'Email', 'Student ID', 'Group', 'Status', 'Last Login'],
        ...exportStudents.map(s => [
          s.name,
          s.email,
          s.studentId,
          s.group?.name || 'No Group',
          s.status,
          s.lastLogin ? new Date(s.lastLogin).toLocaleDateString() : 'Never'
        ])
      ].map(e => e.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'json') {
      const blob = new Blob([JSON.stringify(exportStudents, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={700}>Student Management</Typography>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => navigate('/admin/students/create')}>
          Add Student
        </Button>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        {selected.length > 0 && (
          <Toolbar sx={{ mb: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography sx={{ flex: 1 }} color="primary">{selected.length} selected</Typography>
            <Button onClick={handleBulkSuspend} color="warning">Suspend</Button>
            <Button onClick={handleBulkDelete} color="error">Delete</Button>
            <Button onClick={() => handleExport('csv')} color="info">Export CSV</Button>
            <Button onClick={() => handleExport('json')} color="info">Export JSON</Button>
          </Toolbar>
        )}
        <Box display="flex" gap={2} alignItems="center" mb={2}>
          <TextField
            label="Search"
            size="small"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </Select>
          <Select
            value={sort}
            onChange={e => setSort(e.target.value)}
            displayEmpty
            size="small"
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">Sort By</MenuItem>
            <MenuItem value="name">Name</MenuItem>
            <MenuItem value="id">Student ID</MenuItem>
            <MenuItem value="lastLogin">Last Login</MenuItem>
          </Select>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchStudents}><Refresh /></IconButton>
          </Tooltip>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < students.length}
                      checked={students.length > 0 && selected.length === students.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No students found</TableCell>
                  </TableRow>
                ) : (
                  students.map(student => (
                    <TableRow key={student._id} hover selected={isSelected(student._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isSelected(student._id)}
                          onChange={() => handleSelect(student._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Person fontSize="small" color="primary" />
                          {student.name}
                        </Box>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>
                        {student.group?.name || 'Not Assigned'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status}
                          color={statusColors[student.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => navigate(`/admin/students/${student._id}`)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton onClick={() => navigate(`/admin/students/${student._id}/edit`)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(student._id)}
                            disabled={deletingId === student._id}
                          >
                            {deletingId === student._id ? <CircularProgress size={24} /> : <Delete />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default AdminStudents;
