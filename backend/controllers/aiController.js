import asyncHandler from 'express-async-handler';
import AIInsight from '../models/AIInsight.js';
import AIAction from '../models/AIAction.js';
import { detectGrowthOpportunities } from '../services/growthAgentService.js';
import { executeActionReject, executeCampaignLaunch } from '../services/campaignService.js';

// @desc    Detect fresh growth opportunities
// @route   GET /api/ai/insights
// @access  Private
export const getInsights = asyncHandler(async (req, res) => {
  try {
    const result = await detectGrowthOpportunities(req.user._id);
    res.json(result);
  } catch (error) {
    console.error('Opportunity Detection Failed:', error);
    res.status(500).json({ message: error.message || 'Failed to detect growth opportunities.' });
  }
});

// @desc    Get historical AI opportunities
// @route   GET /api/ai/insights/history
// @access  Private
export const getInsightsHistory = asyncHandler(async (req, res) => {
  const history = await AIInsight.find({ merchantId: req.user._id }).sort({ createdAt: -1 });
  res.json(history);
});

// @desc    Dismiss/Reject an AI opportunity
// @route   POST /api/ai/insights/:id/reject
// @access  Private
export const rejectInsight = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await executeActionReject(req.user._id, id);
  res.json({ message: 'Opportunity dismissed.' });
});

// @desc    Get AIAction audit logs
// @route   GET /api/ai/actions
// @access  Private
export const getAuditActions = asyncHandler(async (req, res) => {
  const logs = await AIAction.find({ merchantId: req.user._id }).populate('insightId').sort({ createdAt: -1 });
  res.json(logs);
});

// @desc    Modify and approve a blocked/proposed action
// @route   POST /api/ai/actions/modify
// @access  Private
export const modifyAndApproveAction = asyncHandler(async (req, res) => {
  const launched = await executeCampaignLaunch(req.user._id, req.body);
  res.status(201).json(launched);
});

// @desc    Delete an audit action log
// @route   DELETE /api/ai/actions/:id
// @access  Private
export const deleteAuditAction = asyncHandler(async (req, res) => {
  const log = await AIAction.findOne({ _id: req.params.id, merchantId: req.user._id });
  if (!log) {
    res.status(404);
    throw new Error('Audit log not found or unauthorized.');
  }
  await AIAction.deleteOne({ _id: req.params.id });
  res.json({ message: 'Audit log deleted successfully.' });
});
