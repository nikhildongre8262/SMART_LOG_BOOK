import { v4 as uuidv4 } from 'uuid';

// Mock submission data
const mockSubmissions = {};

const mockSubmissionService = {
  async updateStatus(submissionId, status) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!mockSubmissions[submissionId]) {
          mockSubmissions[submissionId] = {
            id: submissionId,
            status: 'submitted',
            grade: null,
            feedback: ''
          };
        }
        mockSubmissions[submissionId].status = status;
        
        resolve({ 
          data: mockSubmissions[submissionId] 
        });
      }, 500);
    });
  },
  
  async getMySubmissions(assignmentId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Randomly determine status for demo purposes
        const statuses = ['submitted', 'approved', 'rejected'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        resolve({ 
          data: {
            id: uuidv4(),
            status,
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            file: null,
            feedback: status === 'approved' ? 'Good work!' : '',
            grade: status === 'approved' ? 90 : null
          }
        });
      }, 500);
    });
  }
};

export default mockSubmissionService;
