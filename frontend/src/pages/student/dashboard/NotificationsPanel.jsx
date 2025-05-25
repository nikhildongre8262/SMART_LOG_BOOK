import React from "react";
import { Card, Typography, List, ListItem, ListItemText, Button } from "@mui/material";

const NotificationsPanel = ({ notifications, onMarkRead }) => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6">Notifications</Typography>
    <List>
      {notifications && notifications.length > 0 ? (
        notifications.map((note) => (
          <ListItem key={note._id} divider>
            <ListItemText
              primary={note.title}
              secondary={note.date}
            />
            {!note.read && (
              <Button variant="outlined" size="small" onClick={() => onMarkRead(note._id)}>
                Mark as read
              </Button>
            )}
          </ListItem>
        ))
      ) : (
        <Typography variant="body2">No notifications.</Typography>
      )}
    </List>
  </Card>
);

export default NotificationsPanel;
