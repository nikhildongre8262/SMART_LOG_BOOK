import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Avatar
} from '@mui/material';
import { 
  AccessTime, 
  Description, 
  Download, 
  Edit,
  CheckCircle,
  Grade,
  Cancel,
  HourglassEmpty,
  ErrorOutline,
  Info,
  Verified
} from '@mui/icons-material';
import { format } from 'date-fns';

const AssignmentCard = ({ assignment, onView, onSubmit, submission, setOpenSubmitModal }) => {
  console.log('AssignmentCard props:', { assignment, submission }); // Debug log
  
  const isDeadlinePassed = new Date() > new Date(assignment.deadline);
  const isSubmitted = assignment.submissionStatus === 'submitted';

  const handleSubmit = () => {
    if (!isSubmitted || assignment.allowResubmission) {
      onSubmit(assignment);
    }
  };

  // Status display logic
  const getStatus = () => {
    if (!submission) return 'not_submitted';
    
    // Use approvalStatus if available, otherwise fall back to status
    return submission.approvalStatus || submission.status || 'not_submitted';
  };

  const currentStatus = submission?.approvalStatus || 'pending';

  // Enhanced approval display
  const renderApprovalStatus = () => {
    if (currentStatus !== 'approved') return null;
    
    return (
      <Box sx={{
        backgroundColor: '#e8f5e9',
        padding: '8px',
        borderRadius: '4px',
        marginBottom: '16px',
        borderLeft: '4px solid #4caf50',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <CheckCircle color="success" />
        <Box>
          <Typography variant="subtitle2" color="success.main">
            Approved by Instructor
          </Typography>
          {submission?.approvedAt && (
            <Typography variant="caption" color="text.secondary">
              {new Date(submission.approvedAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  // Status chip component
  const StatusChip = ({ status }) => {
    const getStatusProps = () => {
      switch (status) {
        case 'approved':
          return {
            label: 'Approved',
            color: 'success',
            icon: <CheckCircle />,
            bgColor: '#e8f5e9',
            border: '1px solid #4caf50',
            tooltip: 'This assignment has been approved by your instructor'
          };
        case 'submitted':
          return {
            label: 'Submitted',
            color: 'warning',
            icon: <Description />,
            tooltip: 'Your submission is under review'
          };
        case 'rejected':
          return {
            label: 'Rejected',
            color: 'error',
            icon: <Cancel />,
            tooltip: 'Your submission needs revisions'
          };
        default:
          return {
            label: isDeadlinePassed ? 'Late' : 'Pending',
            color: isDeadlinePassed ? 'warning' : 'default',
            icon: <AccessTime />,
            tooltip: isDeadlinePassed ? 'This assignment is past due' : 'This assignment is pending submission'
          };
      }
    };

    const { label, color, icon, bgColor, border, tooltip } = getStatusProps();

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Tooltip title={tooltip}>
          <Chip 
            label={label}
            color={color}
            icon={icon}
            size="small"
            sx={{
              backgroundColor: bgColor,
              border,
              borderRadius: 1,
              fontWeight: 700,
              fontSize: '0.75rem',
              '& .MuiChip-icon': { color: `${color}.main` }
            }}
          />
        </Tooltip>
      </Box>
    );
  };

  return (
    <Card sx={{ 
      position: 'relative', 
      overflow: 'visible',
      height: '640px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '4px solid',
      borderLeftColor: isDeadlinePassed ? 'error.main' : 'warning.main'
    }}>
      {currentStatus === 'approved' && (
        <Badge
          badgeContent="Approved"
          color="success"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '4px 8px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              backgroundColor: '#4caf50',
              color: 'white',
              border: '2px solid white'
            }
          }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        {renderApprovalStatus()}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" component="h3" color="warning" gutterBottom>
              {assignment.title}
            </Typography>
          </Box>
          <StatusChip status={currentStatus} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {assignment.description}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AccessTime sx={{ fontSize: 16, mr: 0.5, color: isDeadlinePassed ? 'error.main' : 'text.secondary' }} />
          <Typography 
            variant="caption" 
            color={isDeadlinePassed ? 'error' : 'text.secondary'}
          >
            Due: {format(new Date(assignment.deadline), 'MMM dd, yyyy HH:mm')}
          </Typography>
        </Box>

        {assignment.files && assignment.files.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Attached Files:
            </Typography>
            {assignment.files.map((file, index) => (
              <Tooltip key={index} title="Download file">
                <IconButton 
                  size="small" 
                  onClick={() => window.open(file.url, '_blank')}
                  sx={{ mr: 1 }}
                >
                  <Download fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
          </Box>
        )}
        
        {submission?.status && (
          <StatusChip status={submission.status} />
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          size="small"
          startIcon={<Description />}
          onClick={() => onView(assignment)}
        >
          View Details
        </Button>
        {submission?.status === 'rejected' ? (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setOpenSubmitModal(true)}
            size="small"
          >
            Resubmit
          </Button>
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setOpenSubmitModal(true)}
            size="small"
          >
            Submit
          </Button>
        )}
      </Box>
    </Card>
  );
};

export default AssignmentCard; 