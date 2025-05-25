import React from "react";
import { Card, Typography, List, ListItem, ListItemText, Button } from "@mui/material";

const EventsCalendar = ({ events, onRSVP }) => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Typography variant="h6">Upcoming Events</Typography>
    <List>
      {events.map((event) => (
        <ListItem key={event._id} divider>
          <ListItemText
            primary={event.title}
            secondary={event.date}
          />
          <Button variant="outlined" onClick={() => onRSVP(event)}>
            RSVP
          </Button>
        </ListItem>
      ))}
    </List>
  </Card>
);

export default EventsCalendar;
