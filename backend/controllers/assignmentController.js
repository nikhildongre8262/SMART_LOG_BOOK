const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

// Student Methods
exports.getStudentAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching assignments for student:', userId);

    // Get all groups the student is a member of
    const groups = await Group.find({ members: userId });
    if (!groups || groups.length === 0) {
      console.log('No groups found for student');
      return res.json([]);
    }

    const groupIds = groups.map(g => g._id);
    console.log('Student groups:', groupIds);

    // Get all subgroups from these groups
    const subgroups = [];
    for (const group of groups) {
      if (group.subGroups && Array.isArray(group.subGroups)) {
        for (const subGroup of group.subGroups) {
          if (subGroup._id) {
            subgroups.push(subGroup._id);
          }
        }
      }
    }
    console.log('Student subgroups:', subgroups);

    // Find all assignments in these groups and subgroups
    const assignments = await Assignment.find({
      $or: [
        { mainGroup: { $in: groupIds } },
        { subGroup: { $in: subgroups } }
      ]
    })
    .populate({
      path: 'mainGroup',
      select: 'name _id'
    })
    .populate({
      path: 'subGroup',
      select: 'name _id'
    })
    .populate({
      path: 'createdBy',
      select: 'name _id'
    })
    .populate({
      path: 'submissions.student',
      select: 'name _id'
    })
    .lean();

    console.log('Found assignments:', assignments.length);
    if (assignments.length > 0) {
      console.log('Sample assignment:', {
        id: assignments[0]._id,
        title: assignments[0].title,
        mainGroup: assignments[0].mainGroup,
        subGroup: assignments[0].subGroup,
        submissions: assignments[0].submissions
      });
    }

    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map(assignment => {
      // Find the subgroup name from the groups
      let subGroupName = '';
      for (const group of groups) {
        if (group.subGroups) {
          const subGroup = group.subGroups.find(sg => sg._id.toString() === assignment.subGroup.toString());
          if (subGroup) {
            subGroupName = subGroup.name;
            break;
          }
        }
      }

      return {
        ...assignment,
        subGroup: {
          _id: assignment.subGroup,
          name: subGroupName
        },
        submissionStatus: assignment.submissions?.some(sub => sub.student._id.toString() === userId) ? 'submitted' : 'not_submitted'
      };
    });

    res.json(assignmentsWithStatus);
  } catch (err) {
    console.error('Error in getStudentAssignments:', err);
    res.status(500).json({ 
      error: 'Server error', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.getAssignmentDetails = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user.id;

    const assignment = await Assignment.findById(assignmentId)
      .populate('mainGroup', 'name')
      .populate('subGroup', 'name')
      .populate('createdBy', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment's group
    const userGroups = await Group.find({ members: userId });
    const hasAccess = userGroups.some(group => 
      group._id.toString() === assignment.mainGroup._id.toString()
    );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this assignment' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignment details', error: error.message });
  }
};

exports.getStudentSubmission = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user.id;

    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: userId
    }).sort({ submittedAt: -1 }); // Get the latest submission

    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission', error: error.message });
  }
};

exports.getSubmissionHistory = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const userId = req.user.id;

    const submissions = await AssignmentSubmission.find({
      assignment: assignmentId,
      student: userId
    }).sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching submission history', error: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { submissionText } = req.body;
    const studentId = req.user.id;

    console.log('Submitting assignment:', {
      assignmentId: id,
      studentId,
      submissionText,
      files: req.files ? req.files.length : 0
    });

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if student is in the assigned group
    const group = await Group.findById(assignment.mainGroup);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if student is a member of the main group
    const isInGroup = group.members.includes(studentId);
    if (!isInGroup) {
      return res.status(403).json({ message: 'You are not authorized to submit this assignment' });
    }

    // Check for existing submission
    let submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: studentId
    });

    // Calculate if submission is late by comparing with deadline
    const submissionTime = new Date();
    const deadlineTime = new Date(assignment.deadline);
    const isLate = submissionTime.getTime() > deadlineTime.getTime();

    if (submission) {
      if (!assignment.allowResubmission) {
        return res.status(400).json({ message: 'Resubmission is not allowed for this assignment' });
      }
      
      // Update existing submission
      submission.submissionText = submissionText;
      submission.submittedAt = submissionTime;
      submission.isLate = isLate;
      submission.status = 'submitted';
      submission.grade = null;
      submission.feedback = null;
      
      // Handle file uploads
      if (req.files && req.files.length > 0) {
        // Delete old files
        if (submission.files && submission.files.length > 0) {
          for (const file of submission.files) {
            await fs.unlink(file.path);
          }
        }
        
        submission.files = req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        }));
      }
    } else {
      // Create new submission
      submission = new AssignmentSubmission({
        assignment: id,
        student: studentId,
        submissionText,
        submittedAt: submissionTime,
        isLate,
        status: 'submitted',
        files: req.files ? req.files.map(file => ({
          filename: file.filename,
          originalname: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size
        })) : []
      });
    }

    await submission.save();

    // Update assignment's submissions array
    const updatedAssignment = await Assignment.findByIdAndUpdate(
      id,
      {
        $push: {
          submissions: {
            student: studentId,
            submittedAt: submissionTime,
            isLate
          }
        }
      },
      { new: true }
    ).populate('mainGroup', 'name _id')
     .populate('subGroup', 'name _id')
     .populate('createdBy', 'name _id')
     .populate('submissions.student', 'name _id');

    // Add submission status to the response
    const responseAssignment = {
      ...updatedAssignment.toObject(),
      submissionStatus: 'submitted'
    };

    res.status(200).json({
      message: isLate ? 'Assignment submitted late' : 'Assignment submitted successfully',
      assignment: responseAssignment
    });
  } catch (error) {
    console.error('Error in submitAssignment:', error);
    res.status(500).json({ 
      message: 'Error submitting assignment', 
      error: error.message 
    });
  }
};

exports.downloadAllAssignments = async (req, res) => {
  try {
    const subgroupId = req.params.subgroupId;
    const userId = req.user.id;

    // Verify user has access to this subgroup
    const group = await Group.findOne({ 
      _id: subgroupId,
      members: userId
    });

    if (!group) {
      return res.status(403).json({ message: 'Not authorized to access this subgroup' });
    }

    // Get all assignments for this subgroup
    const assignments = await Assignment.find({ subGroup: subgroupId });

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Set response headers
    res.attachment('assignments.zip');
    archive.pipe(res);

    // Add each assignment's files to the archive
    for (const assignment of assignments) {
      if (assignment.files && assignment.files.length > 0) {
        for (const file of assignment.files) {
          const filePath = path.join(__dirname, '..', file.url);
          if (fs.existsSync(filePath)) {
            archive.file(filePath, { name: `${assignment.title}/${file.name}` });
          }
        }
      }
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'Error downloading assignments', error: error.message });
  }
};

// Admin Methods
exports.createAssignment = async (req, res) => {
  try {
    console.log('Creating assignment with data:', {
      body: req.body,
      files: req.files,
      user: req.user
    });

    const { title, description, deadline, mainGroup, subGroup } = req.body;
    const files = req.files || [];

    // Validate required fields
    if (!title || !mainGroup || !subGroup) {
      console.log('Missing required fields:', { title, mainGroup, subGroup });
      return res.status(400).json({ 
        message: 'Missing required fields: title, mainGroup, and subGroup are required' 
      });
    }

    // Verify that the subgroup belongs to the main group
    const group = await Group.findById(mainGroup);
    if (!group) {
      return res.status(404).json({ message: 'Main group not found' });
    }

    // Check if the subgroup exists in the main group
    const subGroupExists = group.subGroups.some(sg => sg._id.toString() === subGroup);
    if (!subGroupExists) {
      return res.status(400).json({ message: 'Invalid subgroup for the selected main group' });
    }

    // Process uploaded files
    const processedFiles = files.map(file => ({
      name: file.originalname,
      url: file.path,
      type: file.mimetype
    }));

    console.log('Processed files:', processedFiles);

    // Create new assignment
    const assignment = new Assignment({
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      mainGroup,
      subGroup,
      files: processedFiles,
      createdBy: req.user.id,
      allowLateSubmission: req.body.allowLateSubmission || false,
      allowResubmission: req.body.allowResubmission || false
    });

    console.log('Created assignment object:', assignment);

    await assignment.save();
    console.log('Assignment saved successfully');

    // Populate the response with group and creator details
    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('mainGroup', 'name')
      .populate('subGroup', 'name')
      .populate('createdBy', 'name');

    console.log('Populated assignment:', populatedAssignment);

    res.status(201).json(populatedAssignment);
  } catch (error) {
    console.error('Detailed error in createAssignment:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Error creating assignment', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('mainGroup', 'name')
      .populate('subGroup', 'name')
      .populate('createdBy', 'name');

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

exports.getSubgroupAssignments = async (req, res) => {
  try {
    const { subgroupId } = req.params;
    const { mainGroup } = req.query;
    const userId = req.user.id;
    
    console.log('Getting subgroup assignments:', {
      subgroupId,
      mainGroup,
      userId,
      role: req.user.role,
      headers: req.headers
    });
    
    if (!mainGroup) {
      console.error('Missing mainGroup parameter');
      return res.status(400).json({ 
        message: 'Main group ID is required',
        receivedParams: { subgroupId, mainGroup }
      });
    }

    // Verify that the subgroup belongs to the main group
    const group = await Group.findById(mainGroup);
    if (!group) {
      console.error('Main group not found:', mainGroup);
      return res.status(404).json({ 
        message: 'Main group not found',
        mainGroup
      });
    }

    // Check if the subgroup exists in the main group
    const subGroupExists = group.subGroups.some(sg => sg._id.toString() === subgroupId);
    if (!subGroupExists) {
      console.error('Invalid subgroup for main group:', {
        subgroupId,
        mainGroup,
        availableSubgroups: group.subGroups.map(sg => ({ id: sg._id, name: sg.name }))
      });
      return res.status(400).json({ 
        message: 'Invalid subgroup for the selected main group',
        subgroupId,
        mainGroup
      });
    }

    // For students, verify they are members of the group
    if (req.user.role === 'student') {
      const isMember = group.members.includes(userId);
      if (!isMember) {
        console.error('Student not a member of group:', {
          userId,
          groupId: mainGroup,
          members: group.members
        });
        return res.status(403).json({ 
          message: 'You are not a member of this group',
          groupId: mainGroup
        });
      }
    }
    
    const assignments = await Assignment.find({ 
      mainGroup: mainGroup,
      subGroup: subgroupId 
    })
    .populate('mainGroup', 'name')
    .populate('subGroup', 'name')
    .populate('createdBy', 'name')
    .populate({
      path: 'submissions.student',
      select: 'name _id'
    });

    console.log('Found assignments:', assignments.length);
    if (assignments.length > 0) {
      console.log('Sample assignment:', {
        id: assignments[0]._id,
        title: assignments[0].title,
        mainGroup: assignments[0].mainGroup,
        subGroup: assignments[0].subGroup,
        submissions: assignments[0].submissions
      });
    }

    // Add submission status for each assignment
    const assignmentsWithStatus = assignments.map(assignment => {
      const submissionStatus = assignment.submissions?.some(sub => 
        sub.student._id.toString() === userId
      ) ? 'submitted' : 'not_submitted';

      return {
        ...assignment.toObject(),
        submissionStatus
      };
    });

    res.json(assignmentsWithStatus);
  } catch (error) {
    console.error('Error in getSubgroupAssignments:', error);
    res.status(500).json({ 
      message: 'Error fetching subgroup assignments', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const updateData = req.body;

    const assignment = await Assignment.findByIdAndUpdate(
      assignmentId, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.id;

    const assignment = await Assignment.findByIdAndDelete(assignmentId);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Delete associated submissions
    await AssignmentSubmission.deleteMany({ assignment: assignmentId });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const assignmentId = req.params.id;
    
    // Get the assignment to check deadline
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get all submissions for this assignment
    const submissions = await AssignmentSubmission.find({ assignment: assignmentId })
      .populate('student', 'name email')
      .sort({ submittedAt: -1 });

    // Process submissions to ensure isLate is correctly set
    const processedSubmissions = submissions.map(submission => {
      const submissionTime = new Date(submission.submittedAt);
      const deadlineTime = new Date(assignment.deadline);
      const isLate = submissionTime.getTime() > deadlineTime.getTime();
      
      return {
        ...submission.toObject(),
        isLate
      };
    });

    res.json(processedSubmissions);
  } catch (error) {
    console.error('Error in getSubmissions:', error);
    res.status(500).json({ 
      message: 'Error fetching submissions', 
      error: error.message 
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { id: assignmentId, studentId } = req.params;
    const { grade, feedback } = req.body;

    // Validate grade
    if (grade === undefined || isNaN(grade) || grade < 0 || grade > 100) {
      return res.status(400).json({ message: 'Invalid grade. Must be a number between 0 and 100.' });
    }

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { 
        assignment: assignmentId,
        student: studentId
      },
      { 
        grade,
        feedback,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: req.user.id
      },
      { new: true }
    );

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error in gradeSubmission:', error);
    res.status(500).json({ 
      message: 'Error grading submission', 
      error: error.message 
    });
  }
};

exports.exportSubmission = async (req, res) => {
  try {
    const { id: assignmentId, studentId } = req.params;
    
    // Get the submission
    const submission = await AssignmentSubmission.findOne({
      assignment: assignmentId,
      student: studentId
    }).populate('student', 'name');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Set response headers
    res.attachment(`${submission.student.name}_submission.zip`);
    archive.pipe(res);

    // Add submission text to a file
    if (submission.submissionText) {
      archive.append(submission.submissionText, { name: 'submission.txt' });
    }

    // Add all files to the archive
    if (submission.files && submission.files.length > 0) {
      for (const file of submission.files) {
        const filePath = path.join(__dirname, '..', file.path);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file.originalname });
        }
      }
    }

    // Add submission metadata
    const metadata = {
      student: submission.student.name,
      submittedAt: submission.submittedAt,
      isLate: submission.isLate,
      status: submission.status,
      grade: submission.grade,
      feedback: submission.feedback
    };
    archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

    await archive.finalize();
  } catch (error) {
    console.error('Error in exportSubmission:', error);
    res.status(500).json({ 
      message: 'Error exporting submission', 
      error: error.message 
    });
  }
};

exports.updateLateSubmissions = async (req, res) => {
  try {
    // Get all assignments
    const assignments = await Assignment.find();
    
    for (const assignment of assignments) {
      const deadlineTime = new Date(assignment.deadline);
      
      // Find all submissions for this assignment
      const submissions = await AssignmentSubmission.find({ assignment: assignment._id });
      
      for (const submission of submissions) {
        const submissionTime = new Date(submission.submittedAt);
        const isLate = submissionTime.getTime() > deadlineTime.getTime();
        
        // Update the submission if isLate status is incorrect
        if (submission.isLate !== isLate) {
          await AssignmentSubmission.findByIdAndUpdate(submission._id, {
            isLate: isLate
          });
        }
      }
    }
    
    res.json({ message: 'Late submissions updated successfully' });
  } catch (error) {
    console.error('Error updating late submissions:', error);
    res.status(500).json({ 
      message: 'Error updating late submissions', 
      error: error.message 
    });
  }
};

exports.forceUpdateLateSubmissions = async (req, res) => {
  try {
    console.log('Starting force update of late submissions...');
    
    // Get all assignments
    const assignments = await Assignment.find();
    console.log(`Found ${assignments.length} assignments`);
    
    let updatedCount = 0;
    
    for (const assignment of assignments) {
      const deadlineTime = new Date(assignment.deadline);
      console.log(`Processing assignment ${assignment._id} with deadline ${deadlineTime}`);
      
      // Find all submissions for this assignment
      const submissions = await AssignmentSubmission.find({ assignment: assignment._id });
      console.log(`Found ${submissions.length} submissions for assignment ${assignment._id}`);
      
      for (const submission of submissions) {
        const submissionTime = new Date(submission.submittedAt);
        const isLate = submissionTime.getTime() > deadlineTime.getTime();
        
        console.log(`Submission ${submission._id}:`, {
          submittedAt: submissionTime,
          deadline: deadlineTime,
          isLate: isLate,
          currentIsLate: submission.isLate
        });
        
        // Force update the submission
        await AssignmentSubmission.findByIdAndUpdate(submission._id, {
          isLate: isLate
        });
        
        // Also update the assignment's submissions array
        await Assignment.updateOne(
          { _id: assignment._id, 'submissions.student': submission.student },
          { 
            $set: { 
              'submissions.$.isLate': isLate 
            } 
          }
        );
        
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} submissions`);
    res.json({ 
      message: 'Late submissions force updated successfully',
      updatedCount: updatedCount
    });
  } catch (error) {
    console.error('Error in forceUpdateLateSubmissions:', error);
    res.status(500).json({ 
      message: 'Error updating late submissions', 
      error: error.message 
    });
  }
};

// Approve submission
exports.approveSubmission = async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          status: 'approved',
          approvalStatus: 'approved',
          approvedAt: new Date(),
          approvedBy: req.user.id,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate('approvedBy', 'name email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Log successful approval
    console.log(`Submission ${submission._id} approved by ${req.user.id}`);
    
    // Emit socket event to notify student
    req.io.emit(`submissionApproved:${submission.student}`, {
      assignmentId: submission.assignment,
      submissionId: submission._id,
      status: submission.status,
      approvalStatus: submission.approvalStatus,
      approvedAt: submission.approvedAt
    });
    
    res.json({
      _id: submission._id,
      status: submission.status,
      approvalStatus: submission.approvalStatus,
      approvedAt: submission.approvedAt,
      approvedBy: submission.approvedBy
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ 
      message: 'Failed to approve submission',
      error: error.message 
    });
  }
};

// Reject submission
exports.rejectSubmission = async (req, res) => {
  try {
    const { reason } = req.body;
    const submission = await AssignmentSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    submission.status = 'rejected';
    submission.approvalStatus = 'rejected';
    submission.rejectionReason = reason;
    
    await submission.save();
    
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update getMySubmission to include approval data
exports.getMySubmission = async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findOne({
      assignment: req.params.assignmentId,
      student: req.user.id
    })
    .populate('approvedBy', 'name email')
    .select('status approvalStatus approvedAt updatedAt feedback');

    if (!submission) {
      return res.status(404).json({ 
        status: 'not_submitted',
        approvalStatus: 'pending'
      });
    }

    res.json({
      status: submission.status,
      approvalStatus: submission.approvalStatus || 'pending',
      approvedAt: submission.approvedAt,
      updatedAt: submission.updatedAt,
      feedback: submission.feedback
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
