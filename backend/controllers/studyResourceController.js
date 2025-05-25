const StudyResource = require('../models/StudyResource');
const Group = require('../models/Group');
const SubGroup = require('../models/SubGroup');
const { getYoutubeThumbnail, getVimeoThumbnail } = require('../utils/videoThumbnails');

// Add a new study resource
exports.addResource = async (req, res) => {
  try {
    const { title, description, videoLink, groupId, subGroupId, categories } = req.body;
    let fileUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    let videoThumbnail = undefined;

    // Auto-fetch video thumbnail if videoLink is provided
    if (videoLink) {
      if (videoLink.includes('youtube.com') || videoLink.includes('youtu.be')) {
        videoThumbnail = getYoutubeThumbnail(videoLink);
      } else if (videoLink.includes('vimeo.com')) {
        videoThumbnail = await getVimeoThumbnail(videoLink);
      }
    }

    const resource = new StudyResource({
      title,
      description,
      fileUrl,
      videoLink,
      videoThumbnail,
      groupId,
      subGroupId,
      categories: categories ? categories.split(',').map(s => s.trim()) : [],
      uploadedBy: req.user.id
    });
    await resource.save();
    res.status(201).json({ success: true, resource });
  } catch (err) {
    console.error('Add Resource Error:', err);
    console.error('Request Body:', req.body);
    if (req.file) console.error('Uploaded File:', req.file);
    res.status(500).json({ success: false, message: 'Failed to add resource.', error: err.message });
  }
};

// Get resources for a group/subgroup
exports.getResources = async (req, res) => {
  try {
    const { groupId, subGroupId } = req.params;
    const resources = await StudyResource.find({ groupId, subGroupId })
      .sort({ createdAt: -1 });
    res.json({ success: true, resources });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch resources.' });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const resource = await StudyResource.findById(resourceId);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found.' });
    // Optionally: remove file from disk/cloud if exists
    await StudyResource.findByIdAndDelete(resourceId);
    res.json({ success: true, message: 'Resource deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete resource.' });
  }
};

// List main groups
exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({});
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch groups.' });
  }
};

// List sub-groups for a group
exports.getSubGroups = async (req, res) => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    res.json({ success: true, subGroups: group.subGroups });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sub-groups.' });
  }
};
