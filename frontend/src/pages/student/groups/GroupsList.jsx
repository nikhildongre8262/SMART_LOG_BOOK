import React, { useState } from "react";
import { Typography, Box, TextField, InputAdornment, CircularProgress } from "@mui/material";
import { Search } from '@mui/icons-material';
import api from '../../../api/api';
import GroupCard from './GroupCard';
import JoinGroupDialog from './JoinGroupDialog';
import LeaveGroupDialog from './LeaveGroupDialog';
import GroupRemoveIcon from '@mui/icons-material/GroupRemove';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const GroupsList = ({ groups = [], refreshGroups, onSelectMainGroup, selectedGroup }) => {
  // UI and dialog states
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [leavingGroupId, setLeavingGroupId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [leavingGroupName, setLeavingGroupName] = useState("");

  // Filtered groups
  const filteredGroups = groups
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    .filter(g => filter === "all" || g.status === filter);

  // --- Handlers ---
  const handleOpenJoin = () => {
    setJoinOpen(true);
    setJoinError("");
  };

  const handleCloseJoin = () => {
    setJoinOpen(false);
    setJoinError("");
  };

  const handleJoin = async (joinCode, joinPassword) => {
    setActionLoading(true);
    setJoinError("");
    try {
      await api.post("/student/groups/join", { groupCode: joinCode, password: joinPassword });
      setJoinOpen(false);
      toast.success("Successfully joined group!");
      refreshGroups && refreshGroups(true, 'join');
    } catch (err) {
      setJoinError(err?.response?.data?.error || "Failed to join group");
      toast.error(err?.response?.data?.error || "Failed to join group");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveClick = (groupId, groupName) => {
    setLeavingGroupId(groupId);
    setLeavingGroupName(groupName);
  };

  const handleLeave = async () => {
    if (!leavingGroupId) return;
    setActionLoading(true);
    try {
      await api.post(`/student/groups/leave/${leavingGroupId}`);
      setLeavingGroupId(null);
      setLeavingGroupName("");
      toast.success("Successfully left group!");
      refreshGroups && refreshGroups(true, 'leave');
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to leave group");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ p: 1.5 }}>
      <TextField
        fullWidth
        size="small"
        placeholder="Search groups..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#666', fontSize: 20 }} />
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#eee',
            },
            '&:hover fieldset': {
              borderColor: '#999',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#666',
            },
          },
        }}
      />

      <Box sx={{ mt: 2 }}>
        {/* Empty state illustration/message */}
        {filteredGroups.length === 0 && (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            py: 6, 
            color: 'text.secondary' 
          }}>
            <GroupRemoveIcon sx={{ fontSize: 48, mb: 2, color: '#e0e0e0' }} />
            <Typography variant="h6" fontWeight={500} color="#666">
              No groups found
            </Typography>
            <Typography variant="body2" color="#999" sx={{ mt: 1 }}>
              Try joining a new group or changing your search.
            </Typography>
          </Box>
        )}
        {/* Group Cards List */}
        {filteredGroups.map((group) => (
          <GroupCard
            key={group._id}
            group={group}
            selected={selectedGroup && selectedGroup._id === group._id}
            onSelect={() => onSelectMainGroup && onSelectMainGroup(group)}
            onLeave={handleLeaveClick}
            actionLoading={actionLoading && leavingGroupId === group._id}
          />
        ))}
      </Box>

      {/* Join Group Dialog */}
      <JoinGroupDialog
        open={joinOpen}
        onClose={handleCloseJoin}
        onJoin={handleJoin}
        loading={actionLoading}
        error={joinError}
      />
      {/* Leave Group Dialog */}
      <LeaveGroupDialog
        open={!!leavingGroupId}
        groupName={leavingGroupName}
        onClose={() => { setLeavingGroupId(null); setLeavingGroupName(""); }}
        onLeave={handleLeave}
        loading={actionLoading}
      />
    </Box>
  );
};

export default GroupsList;
