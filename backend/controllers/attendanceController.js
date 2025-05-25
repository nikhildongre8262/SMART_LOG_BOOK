const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Group = require('../models/Group');
const { exportToCSV, exportToExcel } = require('../utils/export');

// Add Attendance
exports.addAttendance = async (req, res) => {
  try {
    const { groupId, subGroupId, date, lectureNo, day, subject, remarks, records } = req.body;
    const attendance = new Attendance({
      groupId,
      subGroupId,
      date,
      lectureNo,
      day,
      subject,
      remarks,
      records,
      createdBy: req.user.id
    });
    await attendance.save();
    res.status(201).json({ message: 'Attendance saved', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Attendance Records for Sub-Group
exports.getAttendanceBySubGroup = async (req, res) => {
  try {
    const { groupId, subGroupId } = req.params;
    const records = await Attendance.find({ groupId, subGroupId }).populate('records.studentId', 'name email');
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Edit Attendance
exports.editAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const updateData = req.body;
    const attendance = await Attendance.findByIdAndUpdate(attendanceId, updateData, { new: true });
    res.json({ message: 'Attendance updated', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Single Attendance
exports.exportSingleAttendance = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const attendance = await Attendance.findById(attendanceId)
      .populate('records.studentId', 'name')
      .populate('groupId', 'name')
      .populate('subGroupId', 'name');

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Format the data for export
    const formattedData = attendance.records.map(record => ({
      'Student Name': record.studentId.name,
      'Sub Group': attendance.subGroupId.name,
      'Date': new Date(attendance.date).toLocaleDateString(),
      'Lecture No': attendance.lectureNo,
      'Day': attendance.day,
      'Subject': attendance.subject || 'N/A',
      'Status': record.present ? 'Present' : 'Absent',
      'Remarks': attendance.remarks || 'N/A'
    }));

    // Use Excel export instead of CSV
    await exportToExcel(formattedData, res, `attendance_${attendance.date}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export Full Attendance Report
exports.exportFullAttendance = async (req, res) => {
  try {
    const { groupId, subGroupId } = req.params;
    const attendances = await Attendance.find({ groupId, subGroupId }).populate('records.studentId', 'name email');
    // Calculate stats for each student
    const studentStats = {};
    let totalLectures = attendances.length;
    attendances.forEach(att => {
      att.records.forEach(rec => {
        const id = rec.studentId._id.toString();
        if (!studentStats[id]) {
          studentStats[id] = { name: rec.studentId.name, present: 0, absent: 0 };
        }
        if (rec.present) studentStats[id].present++;
        else studentStats[id].absent++;
      });
    });
    // Prepare CSV
    const report = Object.values(studentStats).map(stu => ({
      name: stu.name,
      totalLectures,
      present: stu.present,
      absent: stu.absent,
      percentage: totalLectures ? ((stu.present / totalLectures) * 100).toFixed(2) + '%' : '0%'
    }));
    const csv = exportToCSV(report);
    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_report_${groupId}_${subGroupId}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Attendance Record
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('records.studentId', 'name email')
      .populate('groupId', 'name')
      .populate('subGroupId', 'name');
    
    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
