import React from "react";
import { Card, Typography } from "@mui/material";

const GroupChat = ({ groupId }) => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6">Group Chat</Typography>
    <Typography variant="body2">Chat feature coming soon for group {groupId}!</Typography>
  </Card>
);

export default GroupChat;
