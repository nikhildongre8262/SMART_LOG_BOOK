import React from 'react';
import { Button } from '@mui/material';
import { AssignmentTurnedIn as SubmitIcon } from '@mui/icons-material';

const SubmitButton = ({ assignment, onSubmit }) => {
  const isSubmitted = assignment.submissionStatus === 'submitted';
  const isDeadlinePassed = new Date() > new Date(assignment.deadline);

  // If already submitted and resubmission is not allowed, show non-interactive button
  if (isSubmitted && !assignment.allowResubmission) {
    return (
      <Button
        variant="outlined"
        color="success"
        size="small"
        startIcon={<SubmitIcon />}
        disabled
      >
        Submitted
      </Button>
    );
  }

  // Otherwise, show interactive submit/resubmit button
  return (
    <Button
      variant="outlined"
      color="primary"
      size="small"
      startIcon={<SubmitIcon />}
      onClick={() => onSubmit(assignment)}
    >
      {isSubmitted ? 'Resubmit' : 'Submit'}
    </Button>
  );
};

export default SubmitButton; 